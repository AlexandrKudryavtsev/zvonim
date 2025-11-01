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
	meetingRepo   MeetingRepo
	connections   map[string]map[string]WSConnection
	mu            sync.RWMutex
	shutdown      chan struct{}
	userJoinDelay time.Duration
}

func NewWebSocketService(meetingRepo MeetingRepo, userJoinDelay time.Duration) *websocketService {
	return &websocketService{
		meetingRepo:   meetingRepo,
		connections:   make(map[string]map[string]WSConnection),
		shutdown:      make(chan struct{}),
		userJoinDelay: userJoinDelay,
	}
}

var _ WebSocketUseCase = (*websocketService)(nil)

func (uc *websocketService) HandleConnection(ctx context.Context, conn WSConnection, meetingID, userID string) {
	defer func() {
		conn.Close()
	}()

	uc.registerConnection(meetingID, userID, conn)
	defer uc.unregisterConnection(meetingID, userID)

	if err := uc.meetingRepo.SetUserOnlineStatus(ctx, meetingID, userID, true); err != nil {
		return
	}
	defer uc.meetingRepo.SetUserOnlineStatus(ctx, meetingID, userID, false)

	uc.broadcastUserJoined(meetingID, userID)

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

			uc.handleMessage(ctx, meetingID, userID, &wsMsg)
		}
	}
}

func (uc *websocketService) BroadcastToMeeting(meetingID string, message *entity.WSMessage) error {
	uc.mu.RLock()
	defer uc.mu.RUnlock()

	meetingConnections, exists := uc.connections[meetingID]
	if !exists {
		return fmt.Errorf("meeting not found: %s", meetingID)
	}

	data, err := json.Marshal(message)
	if err != nil {
		return err
	}

	var wg sync.WaitGroup
	for targetUserID, conn := range meetingConnections {
		wg.Add(1)
		go func(targetUserID string, conn WSConnection) {
			defer wg.Done()
			_ = conn.WriteMessage(1, data)
		}(targetUserID, conn)
	}
	wg.Wait()

	return nil
}

func (uc *websocketService) SendToUser(meetingID, targetUserID string, message *entity.WSMessage) error {
	uc.mu.RLock()
	defer uc.mu.RUnlock()

	meetingConnections, exists := uc.connections[meetingID]
	if !exists {
		return fmt.Errorf("meeting not found: %s", meetingID)
	}

	conn, exists := meetingConnections[targetUserID]
	if !exists {
		return fmt.Errorf("user not found in meeting: %s", targetUserID)
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

func (uc *websocketService) registerConnection(meetingID, userID string, conn WSConnection) {
	uc.mu.Lock()
	defer uc.mu.Unlock()

	if _, exists := uc.connections[meetingID]; !exists {
		uc.connections[meetingID] = make(map[string]WSConnection)
	}

	uc.connections[meetingID][userID] = conn
}

func (uc *websocketService) unregisterConnection(meetingID, userID string) {
	uc.mu.Lock()
	defer uc.mu.Unlock()

	message := &entity.WSMessage{
		Type: "user_left",
		Data: map[string]string{"user_id": userID},
		From: userID,
	}

	if meetingConnections, exists := uc.connections[meetingID]; exists {
		data, err := json.Marshal(message)
		if err == nil {
			for targetUserID, conn := range meetingConnections {
				if targetUserID != userID {
					go func(targetUserID string, conn WSConnection) {
						_ = conn.WriteMessage(1, data)
					}(targetUserID, conn)
				}
			}
		}

		delete(meetingConnections, userID)
		if len(meetingConnections) == 0 {
			delete(uc.connections, meetingID)
		}
	}
}

func (uc *websocketService) broadcastUserJoined(meetingID, userID string) {
	time.Sleep(uc.userJoinDelay)

	users, err := uc.meetingRepo.GetMeetingUsers(context.Background(), meetingID)
	if err != nil {
		return
	}

	var userName string
	for _, user := range users {
		if user.ID == userID {
			userName = user.Name
			break
		}
	}

	message := &entity.WSMessage{
		Type: "user_joined",
		Data: map[string]string{
			"user_id":   userID,
			"user_name": userName,
		},
		From: userID,
	}

	uc.BroadcastToMeeting(meetingID, message)
}

func (uc *websocketService) handleMessage(ctx context.Context, meetingID, userID string, message *entity.WSMessage) {
	switch message.Type {
	case "offer":
		if message.To != "" {
			uc.SendToUser(meetingID, message.To, &entity.WSMessage{
				Type: "offer",
				Data: message.Data,
				From: userID,
			})
		}
	case "answer":
		if message.To != "" {
			uc.SendToUser(meetingID, message.To, &entity.WSMessage{
				Type: "answer",
				Data: message.Data,
				From: userID,
			})
		}
	case "ice_candidate":
		if message.To != "" {
			uc.SendToUser(meetingID, message.To, &entity.WSMessage{
				Type: "ice_candidate",
				Data: message.Data,
				From: userID,
			})
		}
	case "user_left":
		uc.BroadcastToMeeting(meetingID, &entity.WSMessage{
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
