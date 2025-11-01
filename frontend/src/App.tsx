import { useState } from 'react';
import { JoinMeeting } from '@/pages/JoinMeeting';
import { Meeting } from '@/pages/Meeting/Meeting';
import type { MeetingData } from '@/types/meeting';

function App() {
  const [roomData, setRoomData] = useState<MeetingData | null>(null);

  const handleJoinSuccess = (data: MeetingData) => {
    setRoomData(data);
  };

  const handleLeaveRoom = () => {
    setRoomData(null);
  };

  return (
    <>
      {!roomData ? (
        <JoinMeeting onJoinSuccess={(el) => handleJoinSuccess({
          roomId: el.meetingId,
          userId: el.userId,
          userName: el.userName,
        })} />
      ) : (
        <Meeting roomData={roomData} onLeaveRoom={handleLeaveRoom} />
      )}
    </>
  );
}

export default App;
