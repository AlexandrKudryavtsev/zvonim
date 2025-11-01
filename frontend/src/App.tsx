import { useState } from 'react';
import { RoomLobby } from './components/RoomLobby';
import { JoinMeeting } from './pages/JoinMeeting';

export interface RoomData {
  roomId: string;
  userId: string;
  userName: string;
}

function App() {
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  const handleJoinSuccess = (data: RoomData) => {
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
        <RoomLobby roomData={roomData} onLeaveRoom={handleLeaveRoom} />
      )}
    </>
  );
}

export default App;
