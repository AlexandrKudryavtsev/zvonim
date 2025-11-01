import React, { useState } from 'react';
import { apiService } from '../services/api';
import cls from './JoinRoomForm.module.scss';

interface JoinRoomFormProps {
    onJoinSuccess: (data: { roomId: string; userId: string; userName: string }) => void;
}

export const JoinRoomForm: React.FC<JoinRoomFormProps> = ({ onJoinSuccess }) => {
    const [userName, setUserName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName.trim()) return;

        setIsLoading(true);
        setError('');

        try {
            const request = {
                user_name: userName.trim(),
                ...(roomId.trim() && { room_id: roomId.trim() }),
            };

            const response = await apiService.joinRoom(request);
            onJoinSuccess({
                roomId: response.room_id,
                userId: response.user_id,
                userName: userName.trim(),
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Произошла ошибка');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={cls.container}>
            <div className={cls.header}>
                <img className={cls.logo} alt='звоним логотип' src='/logo.svg' />
                <h1 className={cls.title}>Звоним</h1>
            </div>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor='userName'>Ваше имя:</label>
                    <input
                        id='userName'
                        type='text'
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor='roomId'>ID встреча (необязательно):</label>
                    <input
                        id='roomId'
                        type='text'
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                        placeholder='Оставьте пустым для создания новой комнаты'
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </div>

                {error && (
                    <div style={{ color: 'red', marginBottom: '15px' }}>
                        {error}
                    </div>
                )}

                <button
                    type='submit'
                    disabled={isLoading || !userName.trim()}
                    style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none' }}
                >
                    {isLoading ? 'Подключение...' : roomId ? 'Войти в комнату' : 'Создать комнату'}
                </button>
            </form>
        </div>
    );
};
