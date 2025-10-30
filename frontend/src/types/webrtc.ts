export interface MediaStreams {
  local: MediaStream | null;
  remote: Map<string, MediaStream>; // userId -> MediaStream
}

export interface RTCPeerConnectionWithUser extends RTCPeerConnection {
  userId: string;
}

export interface CallState {
  isInCall: boolean;
  hasLocalStream: boolean;
  remoteUsers: string[];
}