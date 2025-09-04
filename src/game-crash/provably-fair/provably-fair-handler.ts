import { inject, injectable } from "inversify";
import { reaction } from "mobx";
import { GameUserSettingHandler } from "../../game/game-user-settings/game-user-setting-handler";
import { GameUserSettingStore } from "../../game/game-user-settings/game-user-setting-store";
import { RoundPFHandler } from "../../game/round-pf";
import { MainPlayerStore } from "../../players/main-player-store";
import { GameServiceMessage } from "../../shared";
import { IHandler } from "../../shared/mediator";
import { IGameCrashPermanentUserSettings } from "../game-crash-messages";
import { RoundTimeStore } from "./../../game/rounds/round-time-store";
import { ProvablyFairStore, VerificationMode } from "./provably-fair-store";

@injectable()
export class ProvablyFairHandler implements IHandler<GameServiceMessage.ProvablyFair> {
    constructor(
        @inject(ProvablyFairStore) protected readonly provablyFairStore: ProvablyFairStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(GameUserSettingStore) protected readonly gameUserSettingStore: GameUserSettingStore,
        @inject(GameUserSettingHandler) protected readonly gameUserSettingHandler: GameUserSettingHandler,
        @inject(RoundPFHandler) protected readonly roundPFHandler: RoundPFHandler,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore
    ) {
        reaction(
            () => this.roundTimeStore.isStartRound,
            (isStartRound) => {
                if (isStartRound) {
                    this.provablyFairStore.generateRandomClientSeed();
                    this.saveStorage();
                }
            }
        );
    }
    name = GameServiceMessage.ProvablyFair.eventName;

    handle(pf: GameServiceMessage.ProvablyFair) {
        this.provablyFairStore.pf = pf;
    }

    loadClientSettingFromStorage(data: IGameCrashPermanentUserSettings) {
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
}
