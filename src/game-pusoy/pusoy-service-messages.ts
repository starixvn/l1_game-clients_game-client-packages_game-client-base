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
        static eventName = "submittedPlayer";
    }

    export class StartDeal {
        static eventName = "startDeal";
    }
}

export namespace PusoyClientMessages {
    export const changeArrangement = "submitArrangement";
}
