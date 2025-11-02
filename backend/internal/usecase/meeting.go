package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
)

type meetingService struct {
	meetingRepo MeetingRepo
}

func NewMeetingService(meetingRepo MeetingRepo) *meetingService {
	return &meetingService{
		meetingRepo: meetingRepo,
	}
}

var _ MeetingUseCase = (*meetingService)(nil)

func (uc *meetingService) JoinMeeting(ctx context.Context, req *entity.JoinMeetingRequest) (*entity.JoinMeetingResponse, error) {
	if req.UserName == "" {
		return nil, &entity.ValidationError{Field: "user_name", Reason: "is required"}
	}

	var meetingID string
	var meeting *entity.Meeting
	var err error

	if req.MeetingID == "" {
		meetingID = entity.GenerateMeetingID()
		meeting = &entity.Meeting{
			ID:        meetingID,
			Name:      "Untitled Meeting",
			CreatedAt: time.Now(),
			Users:     []entity.User{},
		}

		if err := uc.meetingRepo.CreateMeeting(ctx, meeting); err != nil {
			return nil, fmt.Errorf("failed to create meeting: %w", err)
		}
	} else {
		meetingID = req.MeetingID
		meeting, err = uc.meetingRepo.GetMeeting(ctx, meetingID)
		if err != nil {
			return nil, fmt.Errorf("failed to get meeting: %w", err)
		}
		if meeting == nil {
			return nil, fmt.Errorf("meeting not found: %s", meetingID)
		}
	}

	user := &entity.User{
		ID:       entity.GenerateUserID(),
		Name:     req.UserName,
		IsOnline: true,
	}

	if err := uc.meetingRepo.AddUserToMeeting(ctx, meetingID, user); err != nil {
		return nil, fmt.Errorf("failed to add user to meeting: %w", err)
	}

	users, err := uc.meetingRepo.GetMeetingUsers(ctx, meetingID)
	if err != nil {
		return nil, fmt.Errorf("failed to get meeting users: %w", err)
	}

	userNames := make([]string, 0, len(users))
	for _, u := range users {
		userNames = append(userNames, u.Name)
	}

	response := &entity.JoinMeetingResponse{
		MeetingID:      meetingID,
		MeetingName:    meeting.Name,
		UserID:         user.ID,
		UsersInMeeting: userNames,
	}

	return response, nil
}

func (uc *meetingService) GetMeetingInfo(ctx context.Context, meetingID string) (*entity.Meeting, error) {
	if meetingID == "" {
		return nil, &entity.ValidationError{Field: "meeting_id", Reason: "is required"}
	}

	meeting, err := uc.meetingRepo.GetMeeting(ctx, meetingID)
	if err != nil {
		return nil, fmt.Errorf("failed to get meeting: %w", err)
	}

	return meeting, nil
}

func (uc *meetingService) LeaveMeeting(ctx context.Context, req *entity.LeaveMeetingRequest) error {
	if req.MeetingID == "" {
		return &entity.ValidationError{Field: "meeting_id", Reason: "is required"}
	}
	if req.UserID == "" {
		return &entity.ValidationError{Field: "user_id", Reason: "is required"}
	}

	if err := uc.meetingRepo.SetUserOnlineStatus(ctx, req.MeetingID, req.UserID, false); err != nil {
		return fmt.Errorf("failed to set user offline: %w", err)
	}

	if err := uc.meetingRepo.RemoveUserFromMeeting(ctx, req.MeetingID, req.UserID); err != nil {
		return fmt.Errorf("failed to remove user from meeting: %w", err)
	}

	return nil
}

func (uc *meetingService) GetOnlineUsers(ctx context.Context, meetingID string) ([]string, error) {
	if meetingID == "" {
		return nil, &entity.ValidationError{Field: "meeting_id", Reason: "is required"}
	}

	users, err := uc.meetingRepo.GetMeetingUsers(ctx, meetingID)
	if err != nil {
		return nil, fmt.Errorf("failed to get meeting users: %w", err)
	}

	onlineUsers := make([]string, 0)
	for _, user := range users {
		if user.IsOnline {
			onlineUsers = append(onlineUsers, user.Name)
		}
	}

	return onlineUsers, nil
}
