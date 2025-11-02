import React, { useEffect, useRef, useState } from 'react';
import { webRTCService } from '@/services/webrtc';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/classNames';
import cls from './VideoCall.module.scss';

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

      // Небольшая задержка для обновления DOM
      setTimeout(() => {
        const videoElement = remoteVideosRef.current.get(remoteUserId);
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }, 100);
    };

    const handleRemoteStreamRemoved = (remoteUserId: string) => {
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

    const handleCallStateChange = (state: any) => {
      const currentRemoteUsers = Array.from(remoteStreams.keys());
      const newRemoteUsers = state.remoteUsers;

      const removedUsers = currentRemoteUsers.filter((userId) => !newRemoteUsers.includes(userId));

      removedUsers.forEach((userId) => {
        handleRemoteStreamRemoved(userId);
      });
    };

    // Подписываемся на события
    webRTCService.onRemoteStream(handleRemoteStream);
    webRTCService.onCallStateChange(handleCallStateChange);

    return () => {
      // Отписываемся от событий
      webRTCService.onRemoteStream(handleRemoteStream);
      webRTCService.onCallStateChange(handleCallStateChange);

      // Очищаем видео элементы
      remoteVideosRef.current.forEach((videoElement) => {
        videoElement.srcObject = null;
      });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    return `Участник ${remoteUserId.slice(0, 6)}`;
  };

  const getVideoButtonVariant = () => {
    return isVideoEnabled ? 'primary' : 'danger';
  };

  const getAudioButtonVariant = () => {
    return isAudioEnabled ? 'primary' : 'danger';
  };

  return (
    <div className={cls.container}>
      <div className={cls.header}>
        <h3 className={cls.title}>Видеозвонок</h3>
        <div className={cls.callInfo}>
          <span className={cls.participantsCount}>
            Участников: {1 + remoteStreams.size}
          </span>
        </div>
      </div>

      {/* Основной контент */}
      <div className={cls.content}>
        {/* Локальное видео */}
        <div className={cls.localVideoSection}>
          <div className={cls.videoHeader}>
            <h4 className={cls.videoTitle}>Вы ({userName})</h4>
            <div className={cls.videoStatus}>
              <div className={cn(cls.statusIndicator, {
                [cls.active]: isVideoEnabled,
                [cls.inactive]: !isVideoEnabled,
              })}>
                📹 {isVideoEnabled ? 'Вкл' : 'Выкл'}
              </div>
              <div className={cn(cls.statusIndicator, {
                [cls.active]: isAudioEnabled,
                [cls.inactive]: !isAudioEnabled,
              })}>
                🎤 {isAudioEnabled ? 'Вкл' : 'Выкл'}
              </div>
            </div>
          </div>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className={cls.video}
          />
        </div>

        {/* Удаленные видео */}
        {Array.from(remoteStreams.keys()).length > 0 && (
          <div className={cls.remoteVideosSection}>
            <h4 className={cls.sectionTitle}>Участники звонка:</h4>
            <div className={cls.remoteVideosGrid}>
              {Array.from(remoteStreams.entries()).map(([remoteUserId, stream]) => (
                <div key={remoteUserId} className={cls.remoteVideoContainer}>
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
                    className={cls.video}
                  />
                  <div className={cls.remoteVideoInfo}>
                    <span className={cls.remoteUserName}>
                      {getRemoteUserName(remoteUserId)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Панель управления */}
      <div className={cls.controls}>
        <Button
          onClick={toggleVideo}
          variant={getVideoButtonVariant()}
          className={cls.controlButton}
        >
          <span className={cls.buttonIcon}>
            {isVideoEnabled ? '📹' : '🚫'}
          </span>
          <span className={cls.buttonText}>
            {isVideoEnabled ? 'Выключить видео' : 'Включить видео'}
          </span>
        </Button>

        <Button
          onClick={toggleAudio}
          variant={getAudioButtonVariant()}
          className={cls.controlButton}
        >
          <span className={cls.buttonIcon}>
            {isAudioEnabled ? '🎤' : '🚫'}
          </span>
          <span className={cls.buttonText}>
            {isAudioEnabled ? 'Выключить звук' : 'Включить звук'}
          </span>
        </Button>
      </div>

      {/* Состояние ожидания */}
      {Array.from(remoteStreams.keys()).length === 0 && (
        <div className={cls.waitingState}>
          <div className={cls.waitingIcon}>⏳</div>
          <p className={cls.waitingText}>
            Ожидание подключения других участников...
          </p>
          <p className={cls.waitingHint}>
            Пригласите участников, отправив им ID встречи
          </p>
        </div>
      )}
    </div>
  );
};
