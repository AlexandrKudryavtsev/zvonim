interface AppConfig {
  api: {
    baseUrl: string
  }
  websocket: {
    baseUrl: string
  }
  webrtc: {
    stunServers: string[]
  }
}

export const config: AppConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL,
  },
  websocket: {
    baseUrl: import.meta.env.VITE_WEBSOCKET_BASE_URL,
  },
  webrtc: {
    stunServers: import.meta.env.VITE_TUNE_SERVERS
      ? import.meta.env.VITE_TUNE_SERVERS.split(',').map((server) => server.trim())
      : [],
  },
} as const;
