import { inject, injectable } from "inversify";
import { makeAutoObservable, when } from "mobx";

import { GameConfigStore } from "../../game/game-configs/game-config-store";
import { RoundStore } from "../../game/rounds/round-store";
import { CrashCashOutStore } from "../cash-out/crash-cash-out-store";
import { GameCrashServiceMessage, IGameCrashUserSettings } from "../game-crash-messages";

@injectable()
export class BetInputStore {
    constructor(
        @inject(RoundStore) private readonly roundStore: RoundStore,
        @inject(GameConfigStore) private readonly gameConfig: GameConfigStore,
        @inject(CrashCashOutStore) private readonly cashOutStore: CrashCashOutStore,
    ) {
        makeAutoObservable(this);
        this.handleBetAmountFromStorageAndOwnBets();
    }

    private _betAmount = -1;
    isOpenBetAmountPopup = false;
    betAmountTemp = 0;
    isDisabledBetInput = false;

    private handleBetAmountFromStorageAndOwnBets() {

        when(
            () => this.roundStore && this.roundStore.ownBets && Object.keys(this.roundStore.ownBets).length > 0,
            () => {
                this.setBetAmountFromOwnBets(this.roundStore.ownBets as GameCrashServiceMessage.CrashOwnBets);
            }
        );
    }

    private setBetAmountFromOwnBets(ownBets: GameCrashServiceMessage.CrashOwnBets) {
        if (ownBets && !ownBets.cashOut && ownBets.amount > 0) {
            this.betAmount = +ownBets.amount;
        }
    }

    initBetAmount(userSetting: IGameCrashUserSettings) {
        this.betAmount = userSetting?.betAmount ? userSetting.betAmount : this.roundStore.minBet;
    }

    get betAmount(): number {
        return this._betAmount;
    }

    set betAmount(amount: number) {
        this._betAmount = amount;
    }

    get decreaseStatus(): boolean {
        return this.betAmount > this.minBet;
    }

    get increaseStatus(): boolean {
        return this.betAmount < this.maxBet;
    }

    get betAmountRatio(): number {
        return this.betAmount * this.cashOutStore.ratio;
    }

    get minBet(): number {
        return this.roundStore.minBet;
    }

    get maxBet(): number {
        return this.roundStore.maxBet;
    }

    get chips(): string[] {
        return this.gameConfig.chips;
    }

    get isAmountGreaterMinBet() {
        return this.minBet <= this.betAmount;
    }
}
