import { inject, injectable } from "inversify";
import { reaction, when } from "mobx";
import { BetStore } from "../../../game/bets";
import { GameUserSettingHandler } from "../../../game/game-user-settings/game-user-setting-handler";
import { GameUserSettingAction, GameUserSettingStore } from "../../../game/game-user-settings/game-user-setting-store";
import { RoundPFHandler } from "../../../game/round-pf";
import { RoundTimeStore } from "../../../game/rounds/round-time-store";
import { MainPlayerStore } from "../../../players/main-player-store";
import { GameServiceMessage } from "../../../shared";
import { IMultipleHandlers } from "../../../shared/mediator";
import { StorageManager, localStorageKeys } from "../../../shared/utils";
import { PFClientSetting, VerificationMode } from "./definitions";
import { ProvablyFairStore } from "./provably-fair-store";

type PFUserSetting = {
    pf: PFClientSetting;
};

@injectable()
export class ProvablyFairHandler implements IMultipleHandlers {
    constructor(
        @inject(ProvablyFairStore) protected readonly provablyFairStore: ProvablyFairStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(GameUserSettingStore) protected readonly gameUserSettingStore: GameUserSettingStore,
        @inject(GameUserSettingHandler) protected readonly gameUserSettingHandler: GameUserSettingHandler,
        @inject(RoundPFHandler) protected readonly roundPFHandler: RoundPFHandler,
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore
    ) {
        when(() => this.mainPlayerStore.readyUserInfo, () => {
            this.loadClientSettingFromStorage();
        });

        reaction(
            () => this.roundTimeStore.isStartRound,
            (isStartRound) => {
                if (isStartRound) {
                    this.provablyFairStore.generateRandomClientSeed();
                    this.saveStorage();
                    this.clearLastBetClientSeed();
                }
            }
        );

        reaction(
            () => this.gameUserSettingStore.permanentStorage,
            (trigger) => {
                if (trigger?.action === GameUserSettingAction.Save) {
                    this.onSaveStorage();
                }
            }
        );

        reaction(
            () => this.betStore.lastReceivedBet,
            (lastReceivedBet) => {
                lastReceivedBet && lastReceivedBet.value > -1 && this.assignLastBetClientSeed();
            }
        );
    }
    eventHandleList = [
        {
            name: GameServiceMessage.ProvablyFair.eventName,
            handle: this.handle,
        },
        {
            name: "clientSeed",
            handle: this.handleReceiveLastClientSeed,
        },
    ];

    private assignLastBetClientSeed() {
        if (!this.provablyFairStore.lastBetClientSeed) {
            this.provablyFairStore.lastBetClientSeed = this.provablyFairStore.clientSeed;
        }
    }

    handle(pf: GameServiceMessage.ProvablyFair) {
        this.provablyFairStore.pf = pf;
    }

    handleReceiveLastClientSeed(clientSeed: string) {
        if (clientSeed === undefined) {
            return;
        }
        this.provablyFairStore.lastBetClientSeed = clientSeed;
        if (this.provablyFairStore.randomClientSeedEnabled) {
            this.provablyFairStore.randomClientSeed = clientSeed;
        } else {
            this.provablyFairStore.manualClientSeed = clientSeed;
        }
    }

    clearLastBetClientSeed() {
        this.provablyFairStore.lastBetClientSeed = null;
    }

    get permanentStorageKey() {
        return `${localStorageKeys.permanentGameUserSetting}-${this.mainPlayerStore.UID}-${this.mainPlayerStore.currencyGroup}`;
    }

    loadClientSettingFromStorage() {
        const data = StorageManager.get(this.permanentStorageKey) as PFUserSetting;
        if (data && data?.pf) {
            const { manualClientSeed, randomClientSeedEnabled, randomClientSeed } = data.pf;
            this.provablyFairStore.manualClientSeed = manualClientSeed;
            this.provablyFairStore.randomClientSeed = randomClientSeed;
            this.provablyFairStore.randomClientSeedEnabled = randomClientSeedEnabled;
        } else {
            this.provablyFairStore.resetClientSetting();
        }
    }

    handleClientSeedPopup(openClientSeedPopup: boolean) {
        this.provablyFairStore.openClientSeedPopup = openClientSeedPopup ? {} : null;
    }

    clientSeedGenerationMode(randomClientSeedEnabled: boolean) {
        this.provablyFairStore.randomClientSeedEnabled = randomClientSeedEnabled;
        this.saveStorage();
    }

    private saveStorage() {
        this.gameUserSettingHandler.savePermanentStorage();
    }

    saveManualClientSeed(manualClientSeed: string) {
        this.provablyFairStore.manualClientSeed = manualClientSeed;
        this.saveStorage();
    }

    openVerificationLatestRound(roundId: number) {
        this.roundPFHandler.requestRoundPF(roundId);
        this.provablyFairStore.openVerification = { mode: VerificationMode.LatestRounds, roundId };
    }

    openVerificationHistory(roundId: number) {
        this.roundPFHandler.requestRoundPF(roundId);
        this.provablyFairStore.openVerification = { mode: VerificationMode.History, roundId };
    }

    closeVerification() {
        this.provablyFairStore.openVerification = null;
    }

    onSaveStorage() {
        const currentSetting = (StorageManager.get(this.permanentStorageKey) || {}) as PFUserSetting;

        const pf = {
            randomClientSeedEnabled: this.provablyFairStore.randomClientSeedEnabled,
            randomClientSeed: this.provablyFairStore.randomClientSeed,
            manualClientSeed: this.provablyFairStore.manualClientSeed,
        };
        currentSetting.pf = pf;

        StorageManager.set(this.permanentStorageKey, currentSetting);
    }
}
