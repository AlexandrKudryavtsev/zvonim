package entity

type WSMessage struct {
	Type string      `json:"type"`
	Data interface{} `json:"data,omitempty"`
	From string      `json:"from,omitempty"`
	To   string      `json:"to,omitempty"`
}

type JoinMeetingRequest struct {
	MeetingID string `json:"meeting_id"`
	UserName  string `json:"user_name"`
}

type JoinMeetingResponse struct {
	MeetingID      string   `json:"meeting_id"`
	UserID         string   `json:"user_id"`
	UsersInMeeting []string `json:"users_in_meeting"`
}

type LeaveMeetingRequest struct {
	MeetingID string `json:"meeting_id"`
	UserID    string `json:"user_id"`
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
