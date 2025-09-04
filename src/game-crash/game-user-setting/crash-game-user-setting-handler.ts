import { inject, injectable } from "inversify";
import { reaction, when } from "mobx";
import { ConnectionStore } from "../../game/connection/connection-store";
import { GameConfigStore } from "../../game/game-configs/game-config-store";
import { GameUserSettingAction, GameUserSettingStore } from "../../game/game-user-settings/game-user-setting-store";
import { RoundRunningHandlers } from "../../game/rounds/round-running-handlers";
import { MainPlayerStore } from "../../players/main-player-store";
import { StorageManager, localStorageKeys } from "../../shared/utils";
import { AutoCashOutStore } from "../auto-cash-out/auto-cash-out-store";
import { BetInputStore } from "../bet-input/bet-input-store";
import { IGameCrashPermanentUserSettings, IGameCrashUserSettings } from "../game-crash-messages";
import { ProvablyFairHandler, ProvablyFairStore } from "../provably-fair";

@injectable()
export class GameCrashUserSettingHandler {
    constructor(
        @inject(RoundRunningHandlers) protected readonly roundRunning: RoundRunningHandlers,
        @inject(ConnectionStore) protected readonly connectStore: ConnectionStore,
        @inject(BetInputStore) protected readonly betInputStore: BetInputStore,
        @inject(AutoCashOutStore) protected readonly autoCashOutStore: AutoCashOutStore,
        @inject(ProvablyFairStore) protected readonly provablyFairStore: ProvablyFairStore,
        @inject(ProvablyFairHandler) protected readonly provablyFairHandler: ProvablyFairHandler,
        @inject(GameUserSettingStore) protected readonly gameUserSettingStore: GameUserSettingStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(GameConfigStore) private readonly gameConfig: GameConfigStore,
    ) {
        when(
            () => this.gameConfig && this.gameConfig.minBet > 0,
            () => {
                const setting = this.getGameUserSetting()
                this.betInputStore.initBetAmount(setting);
                this.autoCashOutStore.loadMultiplierFromStorage(setting);
            }
        );
        when(() => this.mainPlayerStore.readyUserInfo, () => {
            const permanentGameUserSetting = this.getPermanentSetting()
            this.provablyFairHandler.loadClientSettingFromStorage(permanentGameUserSetting);
        });

        reaction(
            () => this.gameUserSettingStore.tempStorage,
            (trigger) => {
                switch (trigger?.action) {
                    case GameUserSettingAction.Save:
                        this.saveTempStorage();
                        break;
                    case GameUserSettingAction.Load:
                        this.reloadOtherStores();
                        break;
                    case GameUserSettingAction.Clear:
                        this.clearTempStorage();
                        break;
                }
            }
        );

        reaction(
            () => this.gameUserSettingStore.permanentStorage,
            (trigger) => {
                if (trigger?.action === GameUserSettingAction.Save) {
                    this.savePermanentStorage();
                }
            }
        );
    }

    reloadOtherStores() {
        const setting = this.getGameUserSetting()
        this.betInputStore.initBetAmount(setting);
        this.autoCashOutStore.loadMultiplierFromStorage(setting);
        const permanentGameUserSetting = this.getPermanentSetting()
        this.provablyFairHandler.loadClientSettingFromStorage(permanentGameUserSetting);
    }

    get tempStorageKey() {
        return `${localStorageKeys.gameUserSetting}-${this.mainPlayerStore.UID}-${this.mainPlayerStore.currencyGroup}`;
    }

    get permanentStorageKey() {
        return `${localStorageKeys.permanentGameUserSetting}-${this.mainPlayerStore.UID}-${this.mainPlayerStore.currencyGroup}`;
    }

    saveTempStorage() {
        const currentSetting: IGameCrashUserSettings = {
            enableAutoCashOut: this.autoCashOutStore.enable,
            autoCashOutMultiplier: this.autoCashOutStore.multiplier,
        };

        if (this.betInputStore.betAmount > 0) {
            currentSetting.betAmount = this.betInputStore.betAmount;
        }

        StorageManager.set(this.tempStorageKey, currentSetting);
    }

    savePermanentStorage() {
        const currentSetting: IGameCrashPermanentUserSettings = {
            pf: {
                randomClientSeedEnabled: this.provablyFairStore.randomClientSeedEnabled,
                randomClientSeed: this.provablyFairStore.randomClientSeed,
                manualClientSeed: this.provablyFairStore.manualClientSeed,
            },
        };

        StorageManager.set(this.permanentStorageKey, currentSetting);
    }

    getGameUserSetting() {
        return StorageManager.get(this.tempStorageKey) as IGameCrashUserSettings;
    }

    getPermanentSetting() {
        return StorageManager.get(this.permanentStorageKey) as IGameCrashPermanentUserSettings;
    }

    clearTempStorage() {
        StorageManager.remove(this.tempStorageKey);
        this.reloadOtherStores()
    }
}
