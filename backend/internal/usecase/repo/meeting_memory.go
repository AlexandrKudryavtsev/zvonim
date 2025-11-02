package repo

import (
	"context"
	"fmt"
	"sync"

	"github.com/AlexandrKudryavtsev/zvonim/internal/entity"
)

type MemoryMeetingRepository struct {
	meetings map[string]*entity.Meeting
	mu       sync.RWMutex
}

func NewMemoryMeetingRepository() *MemoryMeetingRepository {
	return &MemoryMeetingRepository{
		meetings: make(map[string]*entity.Meeting),
	}
}

func (r *MemoryMeetingRepository) CreateMeeting(ctx context.Context, meeting *entity.Meeting) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.meetings[meeting.ID]; exists {
		return fmt.Errorf("meeting already exists: %s", meeting.ID)
	}

	r.meetings[meeting.ID] = meeting
	return nil
}

func (r *MemoryMeetingRepository) GetMeeting(ctx context.Context, meetingID string) (*entity.Meeting, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	meeting, exists := r.meetings[meetingID]
	if !exists {
		return nil, nil
	}

	// Возвращаем копию встречи, чтобы избежать гонок данных
	return r.copyMeeting(meeting), nil
}

func (r *MemoryMeetingRepository) AddUserToMeeting(ctx context.Context, meetingID string, user *entity.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	meeting, exists := r.meetings[meetingID]
	if !exists {
		return fmt.Errorf("meeting not found: %s", meetingID)
	}

	for _, existingUser := range meeting.Users {
		if existingUser.ID == user.ID {
			return fmt.Errorf("user already exists in meeting: %s", user.ID)
		}
	}

	meeting.Users = append(meeting.Users, *user)
	return nil
}

func (r *MemoryMeetingRepository) RemoveUserFromMeeting(ctx context.Context, meetingID, userID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	meeting, exists := r.meetings[meetingID]
	if !exists {
		return fmt.Errorf("meeting not found: %s", meetingID)
	}

	for i, user := range meeting.Users {
		if user.ID == userID {
			meeting.Users = append(meeting.Users[:i], meeting.Users[i+1:]...)
			return nil
		}
	}

	return fmt.Errorf("user not found in meeting: %s", userID)
}

func (r *MemoryMeetingRepository) SetUserOnlineStatus(ctx context.Context, meetingID, userID string, online bool) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	meeting, exists := r.meetings[meetingID]
	if !exists {
		return fmt.Errorf("meeting not found: %s", meetingID)
	}

	for i := range meeting.Users {
		if meeting.Users[i].ID == userID {
			meeting.Users[i].IsOnline = online
			return nil
		}
	}

	return fmt.Errorf("user not found in meeting: %s", userID)
}

func (r *MemoryMeetingRepository) GetMeetingUsers(ctx context.Context, meetingID string) ([]entity.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	meeting, exists := r.meetings[meetingID]
	if !exists {
		return nil, fmt.Errorf("meeting not found: %s", meetingID)
	}

	users := make([]entity.User, len(meeting.Users))
	copy(users, meeting.Users)
	return users, nil
}

// copyMeeting - создает глубокую копию встречи для безопасного использования
func (r *MemoryMeetingRepository) copyMeeting(meeting *entity.Meeting) *entity.Meeting {
	copiedMeeting := &entity.Meeting{
		ID:        meeting.ID,
		Name:      meeting.Name,
		CreatedAt: meeting.CreatedAt,
		Users:     make([]entity.User, len(meeting.Users)),
	}

	copy(copiedMeeting.Users, meeting.Users)
	return copiedMeeting
}
