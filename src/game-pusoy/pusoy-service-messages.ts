export type Hand<T> = {
    front: T;
    middle: T;
    back: T;
};

export type PlayerHand = {
    hand: Hand<number[]>;
    playerId: number;
    slot: number;
};

export type SettlementResult = {
    crack: { isCrack: boolean; units: number };
    natural: { name: string; units: number };
    normal: Hand<number>;
    pusoy: { mini: Record<number, number>; full: number };
    royalty: Hand<{ name: string; units: number }>;
    sum: number;
    slot: number;
    playerId: string;
};

class BasePlayer {
    id: string;
    name: string;
    red: number;
    avatarId: number;
    type: boolean;
    rate?: number;
    slot: number;
}

export namespace PusoyServiceMessages {
    export class RoundData {
        roundId: number;
        playerHand: PlayerHand;
        submittedPlayers: SubmittedPlayer[];
        otherPlayers: OtherPlayer[];
        static eventName = "pusoyRound";
    }

    export class OtherPlayer extends BasePlayer {
        static eventName = "otherPlayer";
    }

    export class OtherPlayers {
        static eventName = "otherPlayers";
    }

    export class SubmittedPlayer extends BasePlayer {
        id: string;
        name: string;
        static eventName = "submittedPlayer";
    }

    export class StartDeal {
        static eventName = "startDeal";
    }
}

export namespace PusoyClientMessages {
    export const changeArrangement = "submitArrangement";
}
