import { Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { JoinMeeting } from '@/pages/JoinMeeting';
import { MeetingPage } from '@/pages/Meeting/MeetingPage';
import { useMeetingStore } from '@/stores';

function App() {
  const [searchParams] = useSearchParams();
  const meetingData = useMeetingStore((state) => state.meetingData);

  // Автоматический редирект если есть meetingData в localStorage
  const shouldRedirectToMeeting = meetingData && !searchParams.get('meeting');

  return (
    <Routes>
      <Route path='/' element={shouldRedirectToMeeting ?
        <Navigate to={`/meeting/${meetingData.meetingId}`} replace /> :
        <JoinMeeting />
      } />
      <Route path='/meeting/:meetingId' element={<MeetingPage />} />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default App;
