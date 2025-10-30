import type { RTCPeerConnectionWithUser, MediaStreams, CallState } from '../types/webrtc';

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnectionWithUser> = new Map();
  private mediaStreams: MediaStreams = {
    local: null,
    remote: new Map()
  };
  private onRemoteStreamCallbacks: ((userId: string, stream: MediaStream) => void)[] = [];
  private onCallStateChangeCallbacks: ((state: CallState) => void)[] = [];

  // Инициализация локального медиапотока
  async initializeLocalStream(): Promise<MediaStream> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      this.mediaStreams.local = stream;
      this.notifyCallStateChange();
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Создание RTCPeerConnection для пользователя
  createPeerConnection(userId: string): RTCPeerConnectionWithUser {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    const pc = new RTCPeerConnection(configuration) as RTCPeerConnectionWithUser;
    pc.userId = userId;

    // Добавляем локальный поток если он есть
    if (this.mediaStreams.local) {
      this.mediaStreams.local.getTracks().forEach(track => {
        pc.addTrack(track, this.mediaStreams.local!);
      });
    }

    // Обработчик ICE кандидатов
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.onIceCandidate(userId, event.candidate);
      }
    };

    // Обработчик удаленного потока
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      this.mediaStreams.remote.set(userId, remoteStream);
      this.notifyRemoteStream(userId, remoteStream);
      this.notifyCallStateChange();
    };

    // Обработчик изменения состояния соединения
    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${userId}:`, pc.connectionState);
      
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        this.mediaStreams.remote.delete(userId);
        this.notifyCallStateChange();
      }
    };

    this.peerConnections.set(userId, pc);
    return pc;
  }

  // Создание оффера для пользователя
  async createOffer(userId: string): Promise<string> {
    const pc = this.peerConnections.get(userId) || this.createPeerConnection(userId);
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    return offer.sdp!;
  }

  // Обработка входящего оффера
  async handleOffer(userId: string, sdp: string): Promise<string> {
    let pc = this.peerConnections.get(userId);
    if (!pc) {
      pc = this.createPeerConnection(userId);
    }

    await pc.setRemoteDescription({ type: 'offer', sdp });
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    return answer.sdp!;
  }

  // Обработка входящего ответа
  async handleAnswer(userId: string, sdp: string): Promise<void> {
    const pc = this.peerConnections.get(userId);
    if (!pc) {
      console.warn(`No peer connection for user ${userId}`);
      return;
    }

    await pc.setRemoteDescription({ type: 'answer', sdp });
  }

  // Обработка ICE кандидата
  async handleIceCandidate(userId: string, candidate: RTCIceCandidateInit): Promise<void> {
    const pc = this.peerConnections.get(userId);
    if (!pc) {
      console.warn(`No peer connection for user ${userId}`);
      return;
    }

    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  }

  // Отправка ICE кандидата через WebSocket
  private onIceCandidate(userId: string, candidate: RTCIceCandidate) {
    // Этот метод будет вызываться извне с WebSocket сервисом
    if (this.onIceCandidateCallback) {
      this.onIceCandidateCallback(userId, candidate);
    }
  }

  // Колбэк для отправки ICE кандидатов (устанавливается извне)
  private onIceCandidateCallback: ((userId: string, candidate: RTCIceCandidate) => void) | null = null;
  setIceCandidateCallback(callback: (userId: string, candidate: RTCIceCandidate) => void) {
    this.onIceCandidateCallback = callback;
  }

  // Подписка на удаленные потоки
  onRemoteStream(callback: (userId: string, stream: MediaStream) => void) {
    this.onRemoteStreamCallbacks.push(callback);
  }

  // Подписка на изменение состояния звонка
  onCallStateChange(callback: (state: CallState) => void) {
    this.onCallStateChangeCallbacks.push(callback);
  }

  // Уведомление о новом удаленном потоке
  private notifyRemoteStream(userId: string, stream: MediaStream) {
    this.onRemoteStreamCallbacks.forEach(callback => callback(userId, stream));
  }

  // Уведомление об изменении состояния звонка
  private notifyCallStateChange() {
    const state = this.getCallState();
    this.onCallStateChangeCallbacks.forEach(callback => callback(state));
  }

  // Получение текущего состояния звонка
  getCallState(): CallState {
    return {
      isInCall: this.mediaStreams.remote.size > 0,
      hasLocalStream: !!this.mediaStreams.local,
      remoteUsers: Array.from(this.mediaStreams.remote.keys())
    };
  }

  // Получение медиапотоков
  getMediaStreams(): MediaStreams {
    return this.mediaStreams;
  }

  // Остановка всех соединений
  stopAllConnections() {
    // Останавливаем все peer connections
    this.peerConnections.forEach((pc) => {
      pc.close();
    });
    this.peerConnections.clear();

    // Останавливаем локальные треки
    if (this.mediaStreams.local) {
      this.mediaStreams.local.getTracks().forEach(track => track.stop());
      this.mediaStreams.local = null;
    }

    // Очищаем удаленные потоки
    this.mediaStreams.remote.clear();

    this.notifyCallStateChange();
  }

  // Установка/снятие медиа (video/audio)
  toggleVideo(enabled: boolean): void {
    if (this.mediaStreams.local) {
      this.mediaStreams.local.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.mediaStreams.local) {
      this.mediaStreams.local.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }
}

export const webRTCService = new WebRTCService();