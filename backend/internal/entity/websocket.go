package entity

type WSMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data,omitempty"`
	From string      `json:"from,omitempty"`
	To   string      `json:"to,omitempty"`
}

type JoinRoomRequest struct {
	RoomID   string `json:"room_id"`
	UserName string `json:"user_name"`
}

type JoinRoomResponse struct {
	RoomID      string   `json:"room_id"`
	UserID      string   `json:"user_id"`
	UsersInRoom []string `json:"users_in_room"`
}

type LeaveRoomRequest struct {
	RoomID string `json:"room_id"`
	UserID string `json:"user_id"`
}

// WebRTC сигнальные сообщения
type WebRTCOffer struct {
	SDP string `json:"sdp"`
}

type WebRTCAnswer struct {
	SDP string `json:"sdp"`
}

type ICECandidate struct {
	Candidate string `json:"candidate"`
}
