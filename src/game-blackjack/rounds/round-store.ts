import { inject, injectable } from "inversify";
import { makeAutoObservable, reaction } from "mobx";
import { MainPlayerStore } from "../../players";
import { GameConfigStore } from "../../game/game-configs";
import { HandsStore } from "../hands";
import { BlackjackActions } from "../blackjack-service-messages";

@injectable()
export class RoundStore {
    constructor(
        @inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore
    ) {
        makeAutoObservable(this);

        reaction(
            () => this.handsStore.hands,
            (hands) => (this._totalBetAmount = Object.values(hands).reduce((acc, hand) => acc + hand.bet, 0))
        );
    }
    isRunning = false;
    roundId = 0;
    _totalBetAmount = 0;
    action = "";

    get totalBetAmount() {
        return this._totalBetAmount;
    }

    get minBet() {
        return Math.max(this.gameConfigStore.minBet, this.mainPlayerStore.stakeLevel.minBet);
    }

    get maxBet() {
        return Math.min(this.gameConfigStore.maxBet, this.mainPlayerStore.stakeLevel.maxBet);
    }

    resetForNewRound() {
        this.isRunning = false;
    }
}
