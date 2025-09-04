import { inject, injectable } from "inversify";
import { makeAutoObservable, when } from "mobx";

import { RoundStore } from "../../game/rounds/round-store";
import { MainPlayerStore } from "../../players/main-player-store";
import { CrashGameConfigStore } from "../game-configs/crash-game-config-store";
import { GameCrashServiceMessage, IGameCrashUserSettings } from "../game-crash-messages";

@injectable()
export class AutoCashOutStore {
    private _enable = false;
    private _multiplier = 0;

    constructor(
        @inject(CrashGameConfigStore) private readonly gameConfigStore: CrashGameConfigStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore
    ) {
        makeAutoObservable(this);
        when(
            () => this.roundStore && this.roundStore.ownBets && Object.keys(this.roundStore.ownBets).length > 0,
            () => {
                this.setMultiplierFromOwnBets(this.roundStore.ownBets as GameCrashServiceMessage.CrashOwnBets);
            }
        );
    }

    loadMultiplierFromStorage(userSetting: IGameCrashUserSettings) {
        if (userSetting) {
            userSetting.autoCashOutMultiplier && (this.multiplier = userSetting.autoCashOutMultiplier);
            userSetting.enableAutoCashOut && (this.enable = userSetting.enableAutoCashOut);
        } else {
            this.resetDefaultValueStore();
        }
    }

    private setMultiplierFromOwnBets(ownBets: GameCrashServiceMessage.CrashOwnBets) {
        if (ownBets && !ownBets.cashOut && ownBets.autoCashOut >= 0) {
            this.enable = false;
            const autoCashOut = +ownBets.autoCashOut;
            if (autoCashOut > 0) {
                this.multiplier = autoCashOut;
                this.enable = true;
            }
        }
    }

    get enable(): boolean {
        return this._enable;
    }

    set enable(trigger: boolean) {
        this._enable = trigger;
    }

    get multiplier(): number {
        return this._multiplier;
    }

    set multiplier(multiplier: number) {
        this._multiplier = multiplier;
    }

    resetDefaultValueStore() {
        this.enable = false;
        this.multiplier = this.gameConfigStore.minMultiplier;
    }
}
