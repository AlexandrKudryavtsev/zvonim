package entity

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Meeting struct {
	ID        string    `json:"meeting_id"`
	Name      string    `json:"meeting_name"`
	Users     []User    `json:"users"`
	CreatedAt time.Time `json:"created_at"`
}

type User struct {
	ID       string `json:"user_id"`
	Name     string `json:"user_name"`
	IsOnline bool   `json:"is_online"`
}

type ValidationError struct {
	Field  string `json:"field"`
	Reason string `json:"reason"`
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("validation error: %s %s", e.Field, e.Reason)
}

func GenerateUserID() string {
	return uuid.New().String()
}

func GenerateMeetingID() string {
	return uuid.New().String()
}
