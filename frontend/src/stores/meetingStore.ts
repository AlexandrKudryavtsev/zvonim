import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MeetingData, UserInfo } from '@/types/meeting';
import type { CallState } from '@/types/webrtc';

interface MeetingStore {
  // Data
  meetingData: MeetingData | null;
  users: UserInfo[];
  callState: CallState;

  // Actions
  joinMeeting: (data: MeetingData) => void;
  leaveMeeting: () => void;
  updateUsers: (users: UserInfo[]) => void;
  updateCallState: (state: Partial<CallState>) => void;
  setLocalStreamReady: (ready: boolean) => void;
}

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      meetingData: null,
      users: [],
      callState: {
        isInCall: false,
        hasLocalStream: false,
        remoteUsers: [],
      },

      joinMeeting: (data: MeetingData) => {
        set({
          meetingData: data,
          users: [],
          callState: {
            isInCall: false,
            hasLocalStream: false,
            remoteUsers: [],
          },
        });
      },

      leaveMeeting: () => {
        set({
          meetingData: null,
          users: [],
          callState: {
            isInCall: false,
            hasLocalStream: false,
            remoteUsers: [],
          },
        });
      },

      updateUsers: (users: UserInfo[]) => {
        set({ users });
      },

      updateCallState: (newState: Partial<CallState>) => {
        set((state) => ({
          callState: { ...state.callState, ...newState },
        }));
      },

      setLocalStreamReady: (ready: boolean) => {
        set((state) => ({
          callState: { ...state.callState, hasLocalStream: ready },
        }));
      },
    }),
    {
      name: 'meeting-storage',
      partialize: (state) => ({
        meetingData: state.meetingData,
      }),
    },
  ),
);
