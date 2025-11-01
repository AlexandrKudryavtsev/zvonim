export interface MeetingData {
  roomId: string;
  userId: string;
  userName: string;
}

export interface JoinRoomRequest {
    room_id?: string;
    user_name: string;
}

export interface JoinRoomResponse {
    room_id: string;
    user_id: string;
    users_in_room: string[];
}

export interface UserInfo {
    user_id: string;
    user_name: string;
    is_online: boolean;
}

export interface RoomInfo {
    room_id: string;
    users: UserInfo[];
    created_at: string;
}

export interface LeaveRoomRequest {
    room_id: string;
    user_id: string;
}
