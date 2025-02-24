export type Card = {
    rank: string;
    suit: number;
};
export class Hand {
    bet: number;
    pos: number; // 1,2,3;
    actions?: string[]; // stand, hit, double, split
    betwin?: number;
    cards?: Card[];
    id?: number;
    total?: number[];
    isStand?: boolean;
    splitFrom?: number;
    newCard?: Card;
}
export const BlackjackActions = {
    NEW: "new",
    RUNNING: "running",
    SEND_DEAL: "sendDeal",
    DEAL: "deal",
    SEND_STAND: "sendStand",
    STAND: "stand",
    SEND_HIT: "sendHit",
    HIT: "hit",
    SEND_DOUBLE: "sendDouble",
    DOUBLE: "double",
    SEND_SPLIT: "sendSplit",
    SPLIT: "split",
    FINISH: "finish",
};

export namespace BlackjackServiceMessages {
    export class Deal {
        roundId: number;
        totalAmount: number;
        hands: Hand[];
        dealer: Card[];
        static readonly eventName = "deal";
    }

    export class Split {
        hands: Hand[];
        static readonly eventName = BlackjackActions.SPLIT;
    }

    export class Double extends Hand {
        newCard: Card;
        static readonly eventName = BlackjackActions.DOUBLE;
    }

    export class Hit extends Hand {
        newCard: Card;
        static readonly eventName = BlackjackActions.HIT;
    }

    export class Stand extends Hand {
        static readonly eventName = BlackjackActions.STAND;
    }

    export class OwnBets {
        roundId: number;
        dealer: Card[];
        hands: Hand[];
        static readonly eventName = "ownBets";
    }

    export class Finish {
        result: Card[];
        settlementResult: number;
        winningHands: { id: number; betwin: number }[];
        static readonly eventName = "finish";
    }
}
