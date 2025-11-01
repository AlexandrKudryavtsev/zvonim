package usecase

import (
	"context"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
)

type (
	// MeetingUseCase - управление встречами и пользователями
	MeetingUseCase interface {
		JoinMeeting(ctx context.Context, req *entity.JoinMeetingRequest) (*entity.JoinMeetingResponse, error)
		GetMeetingInfo(ctx context.Context, meetingID string) (*entity.Meeting, error)
		LeaveMeeting(ctx context.Context, req *entity.LeaveMeetingRequest) error
		GetOnlineUsers(ctx context.Context, meetingID string) ([]string, error)
	}

	// WebSocketUseCase - управление WebSocket соединениями и сообщениями
	WebSocketUseCase interface {
		HandleConnection(ctx context.Context, conn WSConnection, meetingID, userID string)
		BroadcastToMeeting(meetingID string, message *entity.WSMessage) error
		SendToUser(meetingID, userID string, message *entity.WSMessage) error
	}

	MeetingRepo interface {
		CreateMeeting(ctx context.Context, meeting *entity.Meeting) error
		GetMeeting(ctx context.Context, meetingID string) (*entity.Meeting, error)
		AddUserToMeeting(ctx context.Context, meetingID string, user *entity.User) error
		RemoveUserFromMeeting(ctx context.Context, meetingID, userID string) error
		SetUserOnlineStatus(ctx context.Context, meetingID, userID string, online bool) error
		GetMeetingUsers(ctx context.Context, meetingID string) ([]entity.User, error)
	}

	WSConnection interface {
		ReadMessage() ([]byte, error)
		WriteMessage(messageType int, data []byte) error
		Close() error
	}
)
