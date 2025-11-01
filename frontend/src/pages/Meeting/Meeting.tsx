import React, { useState } from 'react';
import { useRoom } from '@/hooks/useRoom';
import { VideoCall } from '@/components/VideoCall';
import { Button } from '@/components/ui/Button';
import { MainLayout } from '@/components/layout/MainLayout';
import type { MeetingData } from '@/types/meeting';
import { cn } from '@/utils/classNames';
import cls from './Meeting.module.scss';

interface MeetingProps {
  roomData: MeetingData;
  onLeaveRoom: () => void;
}

export const Meeting: React.FC<MeetingProps> = ({ roomData, onLeaveRoom }) => {
  const {
    users,
    isConnected,
    error,
    callState,
    leaveRoom,
    startCallWithUser,
    initializeLocalMedia,
    stopAllMedia,
  } = useRoom({
    roomId: roomData.roomId,
    userId: roomData.userId,
    userName: roomData.userName,
    onUserLeft: onLeaveRoom,
  });

  const [isInitializingMedia, setIsInitializingMedia] = useState(false);

  const handleLeaveRoom = async () => {
    await leaveRoom();
    onLeaveRoom();
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomData.roomId);
  };

  const handleStartCallWithUser = async (targetUserId: string) => {
    try {
      if (!callState.hasLocalStream) {
        setIsInitializingMedia(true);
        await initializeLocalMedia();
        setIsInitializingMedia(false);
      }
      await startCallWithUser(targetUserId);
    } catch (err) {
      setIsInitializingMedia(false);
      console.error('Failed to start call:', err);
    }
  };

  const handleInitializeMedia = async () => {
    try {
      setIsInitializingMedia(true);
      await initializeLocalMedia();
    } catch (err) {
      console.error('Failed to initialize media:', err);
    } finally {
      setIsInitializingMedia(false);
    }
  };

  return (
    <MainLayout>
      <div className={cls.container}>
        <div className={cls.header}>
          <div className={cls.roomInfo}>
            <h1 className={cls.title}>Встреча</h1>
            <div className={cls.roomDetails}>
              <div className={cls.detailItem}>
                <span className={cls.detailLabel}>ID встречи:</span>
                <code className={cls.roomId}>{roomData.roomId}</code>
                <Button
                  variant='secondary'
                  size='small'
                  onClick={copyRoomId}
                  className={cls.copyButton}
                >
                  Копировать
                </Button>
              </div>
              <div className={cls.detailItem}>
                <span className={cls.detailLabel}>Ваше имя:</span>
                <span className={cls.userName}>{roomData.userName}</span>
              </div>
            </div>
          </div>

          <div className={cls.connectionStatus}>
            <div className={cls.statusItem}>
              <div className={cn(cls.statusDot, { [cls.connected]: isConnected })} />
              <span>WebSocket {isConnected ? 'подключен' : 'отключен'}</span>
            </div>
            <div className={cls.statusItem}>
              <div className={cn(cls.statusDot, { [cls.connected]: callState.hasLocalStream })} />
              <span>Медиа {callState.hasLocalStream ? 'доступно' : 'не готово'}</span>
            </div>
          </div>

          <Button
            variant='danger'
            onClick={handleLeaveRoom}
            className={cls.leaveButton}
          >
            Покинуть встречу
          </Button>
        </div>

        {error && (
          <div className={cls.error}>
            {error}
          </div>
        )}

        <div className={cls.mediaControls}>
          <h3>Управление медиа</h3>
          <div className={cls.controlButtons}>
            {!callState.hasLocalStream && (
              <Button
                onClick={handleInitializeMedia}
                disabled={isInitializingMedia}
                variant='primary'
              >
                {isInitializingMedia ? 'Подготовка...' : '📹 Включить камеру и микрофон'}
              </Button>
            )}
            {callState.hasLocalStream && (
              <Button
                onClick={stopAllMedia}
                variant='danger'
              >
                🛑 Остановить медиа
              </Button>
            )}
          </div>
        </div>

        {(callState.hasLocalStream || callState.isInCall) && (
          <div className={cls.videoSection}>
            <VideoCall
              userId={roomData.userId}
              userName={roomData.userName}
            />
          </div>
        )}

        <div className={cls.participants}>
          <h2>Участники ({users.length})</h2>
          {users.length === 0 ? (
            <p className={cls.noParticipants}>В встрече нет участников</p>
          ) : (
            <div className={cls.participantsList}>
              {users.map((user) => (
                <div
                  key={user.user_id}
                  className={cn(cls.participant, {
                    [cls.currentUser]: user.user_id === roomData.userId,
                  })}
                >
                  <div className={cls.participantInfo}>
                    <span className={cls.participantName}>
                      {user.user_name}
                      {user.user_id === roomData.userId && <span className={cls.youBadge}>(Вы)</span>}
                    </span>
                    {callState.remoteUsers.includes(user.user_id) && (
                      <span className={cls.inCallBadge}>📞 в звонке</span>
                    )}
                  </div>

                  <div className={cls.participantActions}>
                    <div className={cls.status}>
                      <div className={cn(cls.statusDot, { [cls.connected]: user.is_online })} />
                      <span className={cls.statusText}>
                        {user.is_online ? 'онлайн' : 'офлайн'}
                      </span>
                    </div>

                    {user.user_id !== roomData.userId && user.is_online && (
                      <Button
                        onClick={() => handleStartCallWithUser(user.user_id)}
                        disabled={isInitializingMedia || !callState.hasLocalStream}
                        variant='primary'
                        size='small'
                      >
                        {isInitializingMedia ? 'Подготовка...' : '📞 Позвонить'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
