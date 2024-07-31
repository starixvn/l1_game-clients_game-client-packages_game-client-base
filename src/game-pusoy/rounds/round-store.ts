import { injectable, inject } from "inversify";
import { makeAutoObservable } from "mobx";
import { GameConfigStore } from "../game-configs";
import { Hand, PlayerHand } from "../pusoy-service-messages";

export type HandData = {
    hand: Hand<number[]>;
    suitConfig: { [key: string]: number };
    scoreConfig: any;
};

@injectable()
export class RoundStore {
    constructor(@inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore) {
        makeAutoObservable(this);
    }

    roundId = 0;

    playerHand: PlayerHand;

    get hand() {
        return {
            hand: this.playerHand.hand,
            suitConfig: this.gameConfigStore.suitesMapper,
            scoreConfig: this.gameConfigStore.scoreConfig,
        };
    }
}
