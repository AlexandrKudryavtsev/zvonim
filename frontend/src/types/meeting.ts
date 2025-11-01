export interface MeetingData {
  meetingId: string;
  userId: string;
  userName: string;
}

export interface JoinMeetingRequest {
    meeting_id?: string;
    user_name: string;
}

export interface JoinMeetingResponse {
    meeting_id: string;
    user_id: string;
    users_in_meeting: string[];
}

export interface UserInfo {
    user_id: string;
    user_name: string;
    is_online: boolean;
}

export interface MeetingInfo {
    meeting_id: string;
    users: UserInfo[];
    created_at: string;
}

export interface LeaveMeetingRequest {
    meeting_id: string;
    user_id: string;
}
