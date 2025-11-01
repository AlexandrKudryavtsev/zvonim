import { useState } from 'react';
import { JoinMeeting } from '@/pages/JoinMeeting';
import { Meeting } from '@/pages/Meeting/Meeting';
import type { MeetingData } from '@/types/meeting';

function App() {
  const [meetingData, setMeetingData] = useState<MeetingData | null>(null);

  const handleJoinSuccess = (data: MeetingData) => {
    setMeetingData(data);
  };

  const handleLeaveMeeting = () => {
    setMeetingData(null);
  };

  return (
    <>
      {!meetingData ? (
        <JoinMeeting onJoinSuccess={handleJoinSuccess}/>
      ) : (
        <Meeting meetingData={meetingData} onLeaveMeeting={handleLeaveMeeting} />
      )}
    </>
  );
}

export default App;
