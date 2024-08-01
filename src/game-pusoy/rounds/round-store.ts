import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { Hand, PlayerHand } from "../pusoy-service-messages";

export type HandData = {
    hand: Hand<number[]>;
    suitConfig: { [key: string]: string };
    scoreConfig: any;
};

@injectable()
export class RoundStore {
    suitesMapper: { [key: string]: string } = {};
    scoreConfig: any = {};
    constructor() {
        makeAutoObservable(this);
    }

    roundId = 0;

    initPlayerHand: PlayerHand = {
        hand: {
            front: [],
            middle: [],
            back: [],
        },
        playerId: undefined,
        slot: undefined,
    };

    currentHand: Hand<number[]> = {
        front: [],
        middle: [],
        back: [],
    };

    get hand(): HandData {
        return {
            hand: this.initPlayerHand?.hand,
            suitConfig: this.suitesMapper,
            scoreConfig: this.scoreConfig,
        };
    }
}
