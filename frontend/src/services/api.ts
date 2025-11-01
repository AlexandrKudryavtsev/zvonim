import { config } from '@/config';
import type { JoinRoomRequest, JoinRoomResponse, RoomInfo, LeaveRoomRequest } from '@/types/meeting';


class ApiService {
    async joinRoom(request: JoinRoomRequest): Promise<JoinRoomResponse> {
        const response = await fetch(`${config.api.baseUrl}/room/join`, {
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
        const response = await fetch(`${config.api.baseUrl}/room/${roomId}/info`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async leaveRoom(request: LeaveRoomRequest): Promise<void> {
        const response = await fetch(`${config.api.baseUrl}/room/leave`, {
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
