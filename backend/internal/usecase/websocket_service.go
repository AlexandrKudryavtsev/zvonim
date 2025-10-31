package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
)

type websocketService struct {
	roomRepo      RoomRepo
	connections   map[string]map[string]WSConnection
	mu            sync.RWMutex
	shutdown      chan struct{}
	userJoinDelay time.Duration
}

func NewWebSocketService(roomRepo RoomRepo, userJoinDelay time.Duration) *websocketService {
	return &websocketService{
		roomRepo:      roomRepo,
		connections:   make(map[string]map[string]WSConnection),
		shutdown:      make(chan struct{}),
		userJoinDelay: userJoinDelay,
	}
}

var _ WebSocketUseCase = (*websocketService)(nil)

func (uc *websocketService) HandleConnection(ctx context.Context, conn WSConnection, roomID, userID string) {
	defer func() {
		conn.Close()
	}()

	uc.registerConnection(roomID, userID, conn)
	defer uc.unregisterConnection(roomID, userID)

	if err := uc.roomRepo.SetUserOnlineStatus(ctx, roomID, userID, true); err != nil {
		return
	}
	defer uc.roomRepo.SetUserOnlineStatus(ctx, roomID, userID, false)

	uc.broadcastUserJoined(roomID, userID)

	for {
		select {
		case <-uc.shutdown:
			return
		case <-ctx.Done():
			return
		default:
			message, err := conn.ReadMessage()
			if err != nil {
				return
			}

			var wsMsg entity.WSMessage
			if err := json.Unmarshal(message, &wsMsg); err != nil {
				continue
			}

			uc.handleMessage(ctx, roomID, userID, &wsMsg)
		}
	}
}

func (uc *websocketService) BroadcastToRoom(roomID string, message *entity.WSMessage) error {
	uc.mu.RLock()
	defer uc.mu.RUnlock()

	roomConnections, exists := uc.connections[roomID]
	if !exists {
		return fmt.Errorf("room not found: %s", roomID)
	}

	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	var wg sync.WaitGroup
	for targetUserID, conn := range roomConnections {
		wg.Add(1)
		go func(targetUserID string, conn WSConnection) {
			defer wg.Done()
			_ = conn.WriteMessage(1, data)
		}(targetUserID, conn)
	}
	wg.Wait()

	return nil
}

func (uc *websocketService) SendToUser(roomID, targetUserID string, message *entity.WSMessage) error {
	uc.mu.RLock()
	defer uc.mu.RUnlock()

	roomConnections, exists := uc.connections[roomID]
	if !exists {
		return fmt.Errorf("room not found: %s", roomID)
	}

	conn, exists := roomConnections[targetUserID]
	if !exists {
		return fmt.Errorf("user not found in room: %s", targetUserID)
	}

	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	if err := conn.WriteMessage(1, data); err != nil {
		return err
	}

	return nil
}

func (uc *websocketService) registerConnection(roomID, userID string, conn WSConnection) {
	uc.mu.Lock()
	defer uc.mu.Unlock()

	if _, exists := uc.connections[roomID]; !exists {
		uc.connections[roomID] = make(map[string]WSConnection)
	}

	uc.connections[roomID][userID] = conn
}

func (uc *websocketService) unregisterConnection(roomID, userID string) {
	uc.mu.Lock()
	defer uc.mu.Unlock()

	message := &entity.WSMessage{
		Type: "user_left",
		Data: map[string]string{"user_id": userID},
		From: userID,
	}

	if roomConnections, exists := uc.connections[roomID]; exists {
		data, err := json.Marshal(message)
		if err == nil {
			for targetUserID, conn := range roomConnections {
				if targetUserID != userID {
					go func(targetUserID string, conn WSConnection) {
						_ = conn.WriteMessage(1, data)
					}(targetUserID, conn)
				}
			}
		}

		delete(roomConnections, userID)
		if len(roomConnections) == 0 {
			delete(uc.connections, roomID)
		}
	}
}

func (uc *websocketService) broadcastUserJoined(roomID, userID string) {
	time.Sleep(uc.userJoinDelay)

	message := &entity.WSMessage{
		Type: "user_joined",
		Data: map[string]string{"user_id": userID},
		From: userID,
	}

	uc.BroadcastToRoom(roomID, message)
}

func (uc *websocketService) handleMessage(ctx context.Context, roomID, userID string, message *entity.WSMessage) {
	switch message.Type {
	case "offer":
		if message.To != "" {
			uc.SendToUser(roomID, message.To, &entity.WSMessage{
				Type: "offer",
				Data: message.Data,
				From: userID,
			})
		}
	case "answer":
		if message.To != "" {
			uc.SendToUser(roomID, message.To, &entity.WSMessage{
				Type: "answer",
				Data: message.Data,
				From: userID,
			})
		}
	case "ice_candidate":
		if message.To != "" {
			uc.SendToUser(roomID, message.To, &entity.WSMessage{
				Type: "ice_candidate",
				Data: message.Data,
				From: userID,
			})
		}
	case "user_left":
		uc.BroadcastToRoom(roomID, &entity.WSMessage{
			Type: "user_left",
			Data: map[string]string{"user_id": userID},
			From: userID,
		})
	default:
	}
}

func (uc *websocketService) Shutdown() {
	close(uc.shutdown)
}
