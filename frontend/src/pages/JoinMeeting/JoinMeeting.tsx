import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/Button/Button';
import { TextInput } from '@/components/ui/TextInput';
import { MainLayout } from '@/components/layout/MainLayout';
import { useMeetingStore } from '@/stores';
import cls from './JoinMeeting.module.scss';

export const JoinMeeting: React.FC = () => {
  const navigate = useNavigate();
  const joinMeeting = useMeetingStore((state) => state.joinMeeting);
  const [searchParams] = useSearchParams();
  const [userName, setUserName] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const meetingFromUrl = searchParams.get('meeting');
    if (meetingFromUrl) {
      setMeetingId(meetingFromUrl);
    }
  }, [searchParams]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const request = {
        user_name: userName.trim(),
        ...(meetingId.trim() && { meeting_id: meetingId.trim() }),
      };

      const response = await apiService.joinMeeting(request);

      joinMeeting({
        meetingId: response.meeting_id,
        meetingName: response.meeting_name,
        userId: response.user_id,
        userName: userName.trim(),
      });

      navigate(`/meeting/${response.meeting_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout centerContent>
      <div className={cls.container}>
        <div className={cls.header}>
          <img className={cls.logo} alt='звоним логотип' src='/logo.svg' />
          <h1 className={cls.title}>Звоним</h1>
        </div>

        <form onSubmit={handleSubmit} className={cls.form}>
          <TextInput
            label='Ваше имя'
            id='userName'
            type='text'
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            fullWidth
          />

          <TextInput
            label='ID встречи'
            id='meetingId'
            type='text'
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder='Оставьте пустым для создания новой встречи'
            fullWidth
          />

          {error && (
            <div className={cls.error}>
              {error}
            </div>
          )}

          <Button
            type='submit'
            disabled={isLoading || !userName.trim()}
            fullWidth
            variant='primary'
          >
            {meetingId ? 'Войти во встречу' : 'Создать встречу'}
          </Button>
        </form>
      </div>
    </MainLayout>
  );
};
