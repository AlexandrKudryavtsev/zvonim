import React, { useState } from 'react';
import type { RoomData } from '../App';
import { useRoom } from '@/hooks/useRoom';
import { VideoCall } from './VideoCall';

interface RoomLobbyProps {
  roomData: RoomData;
  onLeaveRoom: () => void;
}

export const RoomLobby: React.FC<RoomLobbyProps> = ({ roomData, onLeaveRoom }) => {
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
    alert('ID комнаты скопирован в буфер обмена!');
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
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      {/* Заголовок и кнопка выхода */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Комната: {roomData.roomId}</h1>
        <button
          onClick={handleLeaveRoom}
          style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          Выйти
        </button>
      </div>

      {/* Информация о пользователе и комнате */}
      <div style={{ marginBottom: '20px' }}>
        <p><strong>Ваше имя:</strong> {roomData.userName}</p>
        <p><strong>Ваш ID:</strong> {roomData.userId}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <strong>ID комнаты:</strong>
          <code style={{ background: '#f5f5f5', padding: '4px 8px', borderRadius: '4px' }}>
            {roomData.roomId}
          </code>
          <button
            onClick={copyRoomId}
            style={{ padding: '4px 8px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
          >
            Копировать
          </button>
        </div>

        {/* Статус подключения */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isConnected ? '#28a745' : '#dc3545',
            }}
          />
          <span style={{ color: isConnected ? '#28a745' : '#dc3545' }}>
            {isConnected ? 'Подключено к WebSocket' : 'Нет подключения WebSocket'}
          </span>
        </div>

        {/* Статус медиа */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: callState.hasLocalStream ? '#28a745' : '#ffc107',
            }}
          />
          <span style={{ color: callState.hasLocalStream ? '#28a745' : '#ffc107' }}>
            {callState.hasLocalStream ? 'Камера/микрофон доступны' : 'Камера/микрофон не инициализированы'}
          </span>
        </div>
      </div>

      {/* Ошибки */}
      {error && (
        <div style={{ color: 'red', marginBottom: '15px', padding: '10px', background: '#ffe6e6', border: '1px solid red' }}>
          {error}
        </div>
      )}

      {/* Управление медиа */}
      <div style={{ marginBottom: '20px', padding: '15px', background: '#e9ecef', borderRadius: '4px' }}>
        <h3>Управление медиа:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!callState.hasLocalStream && (
            <button
              onClick={handleInitializeMedia}
              disabled={isInitializingMedia}
              style={{
                padding: '8px 16px',
                background: isInitializingMedia ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              {isInitializingMedia ? 'Инициализация...' : '📹 Включить камеру/микрофон'}
            </button>
          )}

          {callState.hasLocalStream && (
            <button
              onClick={stopAllMedia}
              style={{
                padding: '8px 16px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
              }}
            >
              🛑 Остановить все медиа
            </button>
          )}
        </div>
      </div>

      {/* Видео-звонок */}
      {(callState.hasLocalStream || callState.isInCall) && (
        <div style={{ marginBottom: '20px' }}>
          <VideoCall
            userId={roomData.userId}
            userName={roomData.userName}
          />
        </div>
      )}

      {/* Список пользователей */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Участники комнаты ({users.length})</h2>
        {users.length === 0 ? (
          <p>В комнате нет участников</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {users.map((user) => (
              <div
                key={user.user_id}
                style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: user.user_id === roomData.userId ? '#e3f2fd' : 'white',
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong>{user.user_name}</strong>
                  {user.user_id === roomData.userId && <span style={{ marginLeft: '8px', color: '#666' }}>(Вы)</span>}

                  {/* Индикатор в звонке */}
                  {callState.remoteUsers.includes(user.user_id) && (
                    <span style={{ marginLeft: '8px', color: '#28a745' }}>📞 в звонке</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {/* Статус онлайн */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: user.is_online ? '#28a745' : '#dc3545',
                      }}
                    />
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {user.is_online ? 'онлайн' : 'офлайн'}
                    </span>
                  </div>

                  {/* Кнопка звонка (только для других онлайн пользователей) */}
                  {user.user_id !== roomData.userId && user.is_online && (
                    <button
                      onClick={() => handleStartCallWithUser(user.user_id)}
                      disabled={isInitializingMedia || !callState.hasLocalStream}
                      style={{
                        padding: '6px 12px',
                        background: callState.hasLocalStream ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    >
                      {isInitializingMedia ? 'Подготовка...' : '📞 Позвонить'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Статус */}
      <div style={{ background: '#e9ecef', padding: '15px', borderRadius: '4px' }}>
        <h3>Статус:</h3>
        <ul>
          <li>✅ HTTP API для управления комнатами</li>
          <li>✅ WebSocket для реального обновления</li>
          <li>✅ Автоматический выход при закрытии вкладки</li>
          <li>✅ WebRTC для видео-звонков</li>
          <li>✅ Видео и аудио управление</li>
        </ul>

        <div style={{ marginTop: '10px' }}>
          <strong>Текущий статус звонка:</strong>
          <ul>
            <li>Локальный поток: {callState.hasLocalStream ? '✅' : '❌'}</li>
            <li>В звонке: {callState.isInCall ? '✅' : '❌'}</li>
            <li>Удаленные участники: {callState.remoteUsers.length}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
