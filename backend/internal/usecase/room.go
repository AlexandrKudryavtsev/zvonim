package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
)

type roomService struct {
	roomRepo RoomRepo
}

func NewRoomService(roomRepo RoomRepo) *roomService {
	return &roomService{
		roomRepo: roomRepo,
	}
}

var _ RoomUseCase = (*roomService)(nil)

func (uc *roomService) JoinRoom(ctx context.Context, req *entity.JoinRoomRequest) (*entity.JoinRoomResponse, error) {
	if req.UserName == "" {
		return nil, &entity.ValidationError{Field: "user_name", Reason: "is required"}
	}

	var roomID string
	var room *entity.Room
	var err error

	if req.RoomID == "" {
		roomID = entity.GenerateRoomID()
		room = &entity.Room{
			ID:        roomID,
			CreatedAt: time.Now(),
			Users:     []entity.User{},
		}

		if err := uc.roomRepo.CreateRoom(ctx, room); err != nil {
			return nil, fmt.Errorf("failed to create room: %w", err)
		}
	} else {
		roomID = req.RoomID
		room, err = uc.roomRepo.GetRoom(ctx, roomID)
		if err != nil {
			return nil, fmt.Errorf("failed to get room: %w", err)
		}
		if room == nil {
			return nil, fmt.Errorf("room not found: %s", roomID)
		}
	}

	user := &entity.User{
		ID:       entity.GenerateUserID(),
		Name:     req.UserName,
		IsOnline: true,
	}

	if err := uc.roomRepo.AddUserToRoom(ctx, roomID, user); err != nil {
		return nil, fmt.Errorf("failed to add user to room: %w", err)
	}

	users, err := uc.roomRepo.GetRoomUsers(ctx, roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to get room users: %w", err)
	}

	userNames := make([]string, 0, len(users))
	for _, u := range users {
		userNames = append(userNames, u.Name)
	}

	response := &entity.JoinRoomResponse{
		RoomID:      roomID,
		UserID:      user.ID,
		UsersInRoom: userNames,
	}

	return response, nil
}

func (uc *roomService) GetRoomInfo(ctx context.Context, roomID string) (*entity.Room, error) {
	if roomID == "" {
		return nil, &entity.ValidationError{Field: "room_id", Reason: "is required"}
	}

	room, err := uc.roomRepo.GetRoom(ctx, roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to get room: %w", err)
	}

	return room, nil
}

func (uc *roomService) LeaveRoom(ctx context.Context, req *entity.LeaveRoomRequest) error {
	if req.RoomID == "" {
		return &entity.ValidationError{Field: "room_id", Reason: "is required"}
	}
	if req.UserID == "" {
		return &entity.ValidationError{Field: "user_id", Reason: "is required"}
	}

	if err := uc.roomRepo.SetUserOnlineStatus(ctx, req.RoomID, req.UserID, false); err != nil {
		return fmt.Errorf("failed to set user offline: %w", err)
	}

	if err := uc.roomRepo.RemoveUserFromRoom(ctx, req.RoomID, req.UserID); err != nil {
		return fmt.Errorf("failed to remove user from room: %w", err)
	}

	return nil
}

func (uc *roomService) GetOnlineUsers(ctx context.Context, roomID string) ([]string, error) {
	if roomID == "" {
		return nil, &entity.ValidationError{Field: "room_id", Reason: "is required"}
	}

	users, err := uc.roomRepo.GetRoomUsers(ctx, roomID)
	if err != nil {
		return nil, fmt.Errorf("failed to get room users: %w", err)
	}

	onlineUsers := make([]string, 0)
	for _, user := range users {
		if user.IsOnline {
			onlineUsers = append(onlineUsers, user.Name)
		}
	}

	return onlineUsers, nil
}
