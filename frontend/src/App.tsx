import React, { useState } from 'react';
import { JoinRoomForm } from './components/JoinRoomForm';
import { RoomLobby } from './components/RoomLobby';

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
    <div className="App">
      {!roomData ? (
        <JoinRoomForm onJoinSuccess={handleJoinSuccess} />
      ) : (
        <RoomLobby roomData={roomData} onLeaveRoom={handleLeaveRoom} />
      )}
    </div>
  );
}

export default App;