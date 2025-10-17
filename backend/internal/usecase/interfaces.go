package usecase

import (
	"context"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
)

type (
	// RoomUseCase - управление комнатами и пользователями
	RoomUseCase interface {
		JoinRoom(ctx context.Context, req *entity.JoinRoomRequest) (*entity.JoinRoomResponse, error)
		GetRoomInfo(ctx context.Context, roomID string) (*entity.Room, error)
		LeaveRoom(ctx context.Context, req *entity.LeaveRoomRequest) error
		GetOnlineUsers(ctx context.Context, roomID string) ([]string, error)
	}

	// WebSocketUseCase - управление WebSocket соединениями и сообщениями
	WebSocketUseCase interface {
		HandleConnection(ctx context.Context, conn WSConnection, roomID, userID string)
		BroadcastToRoom(roomID string, message *entity.WSMessage) error
		SendToUser(roomID, userID string, message *entity.WSMessage) error
	}

	RoomRepo interface {
		CreateRoom(ctx context.Context, room *entity.Room) error
		GetRoom(ctx context.Context, roomID string) (*entity.Room, error)
		AddUserToRoom(ctx context.Context, roomID string, user *entity.User) error
		RemoveUserFromRoom(ctx context.Context, roomID, userID string) error
		SetUserOnlineStatus(ctx context.Context, roomID, userID string, online bool) error
		GetRoomUsers(ctx context.Context, roomID string) ([]entity.User, error)
	}

	WSConnection interface {
		ReadMessage() ([]byte, error)
		WriteMessage(messageType int, data []byte) error
		Close() error
	}
)
