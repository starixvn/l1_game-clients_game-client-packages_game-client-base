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

export namespace PusoyServiceMessages {
    export class RoundData {
        roundId: number;
        playerHand: PlayerHand;
        static eventname = "pusoyRound";
    }
}

export namespace PusoyClientMessages {
    export const changeArrangement = "submitArrangement";
}
