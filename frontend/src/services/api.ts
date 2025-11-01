import { config } from '@/config';
import type { JoinMeetingRequest, JoinMeetingResponse, MeetingInfo, LeaveMeetingRequest } from '@/types/meeting';


class ApiService {
    async joinMeeting(request: JoinMeetingRequest): Promise<JoinMeetingResponse> {
        const response = await fetch(`${config.api.baseUrl}/meeting/join`, {
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

    async getMeetingInfo(meetingId: string): Promise<MeetingInfo> {
        const response = await fetch(`${config.api.baseUrl}/meeting/${meetingId}/info`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async leaveMeeting(request: LeaveMeetingRequest): Promise<void> {
        const response = await fetch(`${config.api.baseUrl}/meeting/leave`, {
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
