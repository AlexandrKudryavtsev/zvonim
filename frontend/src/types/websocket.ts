export interface WSMessage {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    from: string;
    to?: string;
}

export interface UserJoinedMessage extends WSMessage {
    type: 'user_joined';
    data: {
        user_id: string;
    };
}

export interface UserLeftMessage extends WSMessage {
    type: 'user_left';
    data: {
        user_id: string;
    };
}

export interface OfferMessage extends WSMessage {
    type: 'offer';
    data: {
        sdp: string;
    };
}

export interface AnswerMessage extends WSMessage {
    type: 'answer';
    data: {
        sdp: string;
    };
}

export interface IceCandidateMessage extends WSMessage {
    type: 'ice_candidate';
    data: {
        candidate: string;
    };
}
