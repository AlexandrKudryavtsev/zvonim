import type { JoinRoomRequest, JoinRoomResponse, RoomInfo, LeaveRoomRequest } from '../types/room';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class ApiService {
    async joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
        const response = await fetch(`${API_BASE_URL}/room/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async getRoomInfo(roomId: string): Promise<RoomInfo> {
        const response = await fetch(`${API_BASE_URL}/room/${roomId}/info`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async leaveRoom(request: LeaveRoomRequest): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/room/leave`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    }
}

export const apiService = new ApiService();
