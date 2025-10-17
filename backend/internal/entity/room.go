package entity

import (
	"fmt"
	"time"
)

type Room struct {
	ID        string    `json:"room_id"`
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
