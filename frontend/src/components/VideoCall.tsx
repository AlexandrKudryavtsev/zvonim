import React, { useEffect, useRef, useState } from 'react';
import { webRTCService } from '../services/webrtc';

interface VideoCallProps {
  userId: string;
  userName: string;
}

export const VideoCall: React.FC<VideoCallProps> = ({ userName }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideosRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

  useEffect(() => {
    const updateLocalVideo = () => {
      const streams = webRTCService.getMediaStreams();
      if (localVideoRef.current && streams.local) {
        localVideoRef.current.srcObject = streams.local;
      }
    };

    updateLocalVideo();

    const handleRemoteStream = (remoteUserId: string, stream: MediaStream) => {
      setRemoteStreams((prev) => new Map(prev.set(remoteUserId, stream)));

      setTimeout(() => {
        const videoElement = remoteVideosRef.current.get(remoteUserId);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 100);
    };

    const handleRemoteStreamRemoved = (remoteUserId: string) => {
      console.log('Remote stream removed for user:', remoteUserId);

      const videoElement = remoteVideosRef.current.get(remoteUserId);
      if (videoElement) {
        videoElement.srcObject = null;
      }

      setRemoteStreams((prev) => {
        const newMap = new Map(prev);
        newMap.delete(remoteUserId);
        return newMap;
      });
    };

    webRTCService.onRemoteStream(handleRemoteStream);

    const handleCallStateChange = (state: any) => {
      const currentRemoteUsers = Array.from(remoteStreams.keys());
      const newRemoteUsers = state.remoteUsers;

      const removedUsers = currentRemoteUsers.filter((userId) => !newRemoteUsers.includes(userId));

      removedUsers.forEach((userId) => {
        handleRemoteStreamRemoved(userId);
      });
    };

    webRTCService.onCallStateChange(handleCallStateChange);

    return () => {
      remoteVideosRef.current.forEach((videoElement) => {
        videoElement.srcObject = null;
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    remoteStreams.forEach((stream, remoteUserId) => {
      const videoElement = remoteVideosRef.current.get(remoteUserId);
      if (videoElement && videoElement.srcObject !== stream) {
        videoElement.srcObject = stream;
      }
    });
  }, [remoteStreams]);

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    webRTCService.toggleVideo(newState);
    setIsVideoEnabled(newState);
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    webRTCService.toggleAudio(newState);
    setIsAudioEnabled(newState);
  };

  const getRemoteUserName = (remoteUserId: string) => {
    // TODO: добавить логику для получения имени пользователя
    return `Пользователь ${remoteUserId.slice(0, 8)}`;
  };

  return (
    <div style={{ padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
      <h3>Видео-звонок</h3>

      <div style={{ marginBottom: '20px' }}>
        <h4>Ваше видео ({userName})</h4>
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: '300px',
            height: '200px',
            background: '#000',
            borderRadius: '8px',
          }}
        />
      </div>

      {Array.from(remoteStreams.keys()).length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Участники звонка:</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {Array.from(remoteStreams.entries()).map(([remoteUserId, stream]) => (
              <div key={remoteUserId} style={{ textAlign: 'center' }}>
                <video
                  ref={(el) => {
                    if (el) {
                      remoteVideosRef.current.set(remoteUserId, el);
                      if (stream && el.srcObject !== stream) {
                        el.srcObject = stream;
                      }
                    } else {
                      remoteVideosRef.current.delete(remoteUserId);
                    }
                  }}
                  autoPlay
                  playsInline
                  style={{
                    width: '300px',
                    height: '200px',
                    background: '#000',
                    borderRadius: '8px',
                  }}
                />
                <div>{getRemoteUserName(remoteUserId)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button
          onClick={toggleVideo}
          style={{
            padding: '10px 20px',
            background: isVideoEnabled ? '#28a745' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isVideoEnabled ? '📹 Выкл. видео' : '📹 Вкл. видео'}
        </button>

        <button
          onClick={toggleAudio}
          style={{
            padding: '10px 20px',
            background: isAudioEnabled ? '#28a745' : '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
          }}
        >
          {isAudioEnabled ? '🎤 Выкл. аудио' : '🎤 Вкл. аудио'}
        </button>
      </div>

      {Array.from(remoteStreams.keys()).length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
          Ожидание подключения других участников...
        </div>
      )}
    </div>
  );
};
