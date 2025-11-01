/* eslint-disable no-case-declarations */
import { useState, useEffect, useCallback } from 'react';
import type { UserInfo } from '@/types/meeting';
import type {
  WSMessage,
  UserJoinedMessage,
  UserLeftMessage,
  OfferMessage,
  AnswerMessage,
  IceCandidateMessage,
} from '@/types/websocket';
import { apiService } from '@/services/api';
import { webSocketService } from '@/services/websocket';
import { webRTCService } from '@/services/webrtc';
import type { CallState } from '@/types/webrtc';
import { config } from '@/config';

interface UseRoomProps {
  roomId: string;
  userId: string;
  userName: string;
  onUserLeft?: () => void;
}

export const useRoom = ({ roomId, userId, onUserLeft }: UseRoomProps) => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    hasLocalStream: false,
    remoteUsers: [],
  });

  const loadRoomInfo = useCallback(async () => {
    try {
      const roomInfo = await apiService.getRoomInfo(roomId);
      setUsers(roomInfo.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки информации о комнате');
    }
  }, [roomId]);

  const initializeWebRTC = useCallback(async () => {
    try {
      webRTCService.setIceCandidateCallback((targetUserId, candidate) => {
        webSocketService.sendMessage({
          type: 'ice_candidate',
          data: { candidate: candidate.toJSON() },
          to: targetUserId,
        });
      });

      webRTCService.onRemoteStream((remoteUserId, stream) => {
        console.log('Remote stream received from:', remoteUserId, stream);
      });

      webRTCService.onCallStateChange((state) => {
        setCallState(state);
      });

    } catch (err) {
      console.error('WebRTC initialization error:', err);
    }
  }, []);

  const handleWebRTCSignaling = useCallback(async (message: WSMessage) => {
    try {
      switch (message.type) {
        case 'offer':
          const offerMessage = message as OfferMessage;
          console.log('Received offer from:', message.from);

          const answerSdp = await webRTCService.handleOffer(message.from, offerMessage.data.sdp);

          webSocketService.sendMessage({
            type: 'answer',
            data: { sdp: answerSdp },
            to: message.from,
          });
          break;

        case 'answer':
          const answerMessage = message as AnswerMessage;
          console.log('Received answer from:', message.from);
          await webRTCService.handleAnswer(message.from, answerMessage.data.sdp);
          break;

        case 'ice_candidate':
          const iceMessage = message as IceCandidateMessage;
          console.log('Received ICE candidate from:', message.from);
          await webRTCService.handleIceCandidate(message.from, iceMessage.data.candidate as RTCIceCandidateInit);
          break;
      }
    } catch (err) {
      console.error('WebRTC signaling error:', err);
    }
  }, []);

  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    console.log('WebSocket message received:', message);

    switch (message.type) {
      case 'user_joined':
        const joinMessage = message as UserJoinedMessage;
        setUsers((prev) => {
          if (prev.find((user) => user.user_id === joinMessage.data.user_id)) {
            return prev;
          }
          return [...prev, {
            user_id: joinMessage.data.user_id,
            user_name: joinMessage.data.user_name,
            is_online: true,
          }];
        });
        break;

      case 'user_left':
        const leftMessage = message as UserLeftMessage;

        // TODO исправить типизацию
        const pc = (webRTCService as any).peerConnections.get(leftMessage.data.user_id);
        if (pc) {
          pc.close();
          (webRTCService as any).peerConnections.delete(leftMessage.data.user_id);
        }

        (webRTCService as any).mediaStreams.remote.delete(leftMessage.data.user_id);

        (webRTCService as any).notifyCallStateChange();

        setUsers((prev) => prev.filter((user) => user.user_id !== leftMessage.data.user_id));
        break;

      case 'offer':
      case 'answer':
      case 'ice_candidate':
        handleWebRTCSignaling(message);
        break;

      default:
        console.log('Unhandled message type:', message.type);
    }
  }, [handleWebRTCSignaling]);

  const startCallWithUser = useCallback(async (targetUserId: string) => {
    try {
      if (!callState.hasLocalStream) {
        await webRTCService.initializeLocalStream();
      }

      const offerSdp = await webRTCService.createOffer(targetUserId);

      webSocketService.sendMessage({
        type: 'offer',
        data: { sdp: offerSdp },
        to: targetUserId,
      });

    } catch (err) {
      console.error('Error starting call:', err);
      setError('Ошибка при начале звонка');
    }
  }, [callState.hasLocalStream]);

  const initializeLocalMedia = useCallback(async () => {
    try {
      await webRTCService.initializeLocalStream();
    } catch (err) {
      console.error('Error initializing media:', err);
      setError('Ошибка доступа к камере/микрофону');
    }
  }, []);

  const stopAllMedia = useCallback(() => {
    webRTCService.stopAllConnections();
  }, []);

  const connectWebSocket = useCallback(async () => {
    try {
      await webSocketService.connect(roomId, userId);
      setIsConnected(true);
      setError('');

      webSocketService.addMessageHandler(handleWebSocketMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка подключения WebSocket');
      setIsConnected(false);
    }
  }, [roomId, userId, handleWebSocketMessage]);

  const disconnectWebSocket = useCallback(() => {
    webSocketService.removeMessageHandler(handleWebSocketMessage);
    webSocketService.disconnect();
    setIsConnected(false);
  }, [handleWebSocketMessage]);

  const leaveRoom = useCallback(async () => {
    try {
      console.log('Leaving room...');

      if (onUserLeft) {
        console.log('Calling onUserLeft callback');
        onUserLeft();
      }

      await apiService.leaveRoom({
        room_id: roomId,
        user_id: userId,
      });
      console.log('API leave request completed');

    } catch (err) {
      console.error('Ошибка при выходе из комнаты:', err);
    } finally {
      console.log('Cleaning up local state...');
      stopAllMedia();
      disconnectWebSocket();
    }
  }, [roomId, userId, disconnectWebSocket, stopAllMedia, onUserLeft]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      stopAllMedia();
      if (navigator.sendBeacon) {
        const data = new Blob([
          JSON.stringify({
            room_id: roomId,
            user_id: userId,
          }),
        ], { type: 'application/json' });

        navigator.sendBeacon(`${config.api.baseUrl}/room/leave`, data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, userId, stopAllMedia]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      if (!isMounted) return;

      try {
        await loadRoomInfo();
        await initializeWebRTC();
        await connectWebSocket();
      } catch (err) {
        if (isMounted) {
          console.error('Initialization error:', err);
          setError('Ошибка инициализации комнаты');
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      stopAllMedia();
      disconnectWebSocket();
    };
  }, [loadRoomInfo, connectWebSocket, disconnectWebSocket, initializeWebRTC, stopAllMedia]);

  return {
    users,
    isConnected,
    error,
    callState,
    loadRoomInfo,
    leaveRoom,
    startCallWithUser,
    initializeLocalMedia,
    stopAllMedia,
    sendMessage: webSocketService.sendMessage.bind(webSocketService),
    getMediaStreams: webRTCService.getMediaStreams.bind(webRTCService),
    toggleVideo: webRTCService.toggleVideo.bind(webRTCService),
    toggleAudio: webRTCService.toggleAudio.bind(webRTCService),
  };
};
