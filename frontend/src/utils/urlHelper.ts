export const getBaseUrl = () => {
    if (import.meta.env.PROD) {
        return `${window.location.protocol}//${window.location.host}`;
    }
    return import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';
};

export const getShareableLink = (meetingId: string) => {
    return `${getBaseUrl()}/?meeting=${meetingId}`;
};
