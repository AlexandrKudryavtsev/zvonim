package repo

import (
	"context"
	"fmt"
	"sync"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
)

type MemoryRoomRepository struct {
	rooms map[string]*entity.Room
	mu    sync.RWMutex
}

func NewMemoryRoomRepository() *MemoryRoomRepository {
	return &MemoryRoomRepository{
		rooms: make(map[string]*entity.Room),
	}
}

func (r *MemoryRoomRepository) CreateRoom(ctx context.Context, room *entity.Room) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.rooms[room.ID]; exists {
		return fmt.Errorf("room already exists: %s", room.ID)
	}

	r.rooms[room.ID] = room
	return nil
}

func (r *MemoryRoomRepository) GetRoom(ctx context.Context, roomID string) (*entity.Room, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	room, exists := r.rooms[roomID]
	if !exists {
		return nil, nil
	}

	// Возвращаем копию комнаты, чтобы избежать гонок данных
	return r.copyRoom(room), nil
}

func (r *MemoryRoomRepository) AddUserToRoom(ctx context.Context, roomID string, user *entity.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	room, exists := r.rooms[roomID]
	if !exists {
		return fmt.Errorf("room not found: %s", roomID)
	}

	for _, existingUser := range room.Users {
		if existingUser.ID == user.ID {
			return fmt.Errorf("user already exists in room: %s", user.ID)
		}
	}

	room.Users = append(room.Users, *user)
	return nil
}

func (r *MemoryRoomRepository) RemoveUserFromRoom(ctx context.Context, roomID, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	room, exists := r.rooms[roomID]
	if !exists {
		return fmt.Errorf("room not found: %s", roomID)
	}

	for i, user := range room.Users {
		if user.ID == userID {
			room.Users = append(room.Users[:i], room.Users[i+1:]...)
			return nil
		}
	}

	return fmt.Errorf("user not found in room: %s", userID)
}

func (r *MemoryRoomRepository) SetUserOnlineStatus(ctx context.Context, roomID, userID string, online bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	room, exists := r.rooms[roomID]
	if !exists {
		return fmt.Errorf("room not found: %s", roomID)
	}

	for i := range room.Users {
		if room.Users[i].ID == userID {
			room.Users[i].IsOnline = online
			return nil
		}
	}

	return fmt.Errorf("user not found in room: %s", userID)
}

func (r *MemoryRoomRepository) GetRoomUsers(ctx context.Context, roomID string) ([]entity.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	room, exists := r.rooms[roomID]
	if !exists {
		return nil, fmt.Errorf("room not found: %s", roomID)
	}

	users := make([]entity.User, len(room.Users))
	copy(users, room.Users)
	return users, nil
}

// copyRoom - создает глубокую копию комнаты для безопасного использования
func (r *MemoryRoomRepository) copyRoom(room *entity.Room) *entity.Room {
	copiedRoom := &entity.Room{
		ID:        room.ID,
		CreatedAt: room.CreatedAt,
		Users:     make([]entity.User, len(room.Users)),
	}

	copy(copiedRoom.Users, room.Users)
	return copiedRoom
}
