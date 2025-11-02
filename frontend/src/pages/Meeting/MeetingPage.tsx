import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Meeting } from './Meeting';
import { useMeetingStore } from '@/stores';
import { MainLayout } from '@/components/layout/MainLayout';

export const MeetingPage: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const meetingData = useMeetingStore((state) => state.meetingData);
  const leaveMeeting = useMeetingStore((state) => state.leaveMeeting);

  useEffect(() => {
    if (!meetingData || meetingData.meetingId !== meetingId) {
      navigate('/');
      return;
    }
  }, [meetingData, meetingId, navigate]);

  const handleLeaveMeeting = () => {
    leaveMeeting();
    navigate('/');
  };

  if (!meetingData) {
    return (
      <MainLayout centerContent>
        <div>Загрузка...</div>
      </MainLayout>
    );
  }

  return (
    <Meeting
      meetingData={meetingData}
      onLeaveMeeting={handleLeaveMeeting}
    />
  );
};
