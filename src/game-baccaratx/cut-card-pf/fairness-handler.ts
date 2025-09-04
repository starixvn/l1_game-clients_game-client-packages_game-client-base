import { inject, injectable } from "inversify";
import * as _ from "lodash";
import { reaction, when } from "mobx";
import { ConnectionStore } from "../../game/connection/connection-store";
import { GameUserSettingHandler } from "../../game/game-user-settings/game-user-setting-handler";
import { GameUserSettingAction, GameUserSettingStore } from "../../game/game-user-settings/game-user-setting-store";
import { MainPlayerStore } from "../../players/main-player-store";
import { GameClientEmitMessage } from "../../shared/models/game-messages";
import { StorageManager, localStorageKeys } from "../../shared/utils";
import { ShoePFHandler } from "../shoe-pf/shoe-pf-handler";
import { ShoeStore } from "../shoes/shoe-store";
import { FairnessStore } from "./fairness-store";

type FairnessUserSetting = {
    clientSeed: string;
    dontShowAgain: boolean;
};

@injectable()
export class FairnessHandler {
    constructor(
        @inject(FairnessStore) protected readonly fairnessStore: FairnessStore,
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore,
        @inject(GameUserSettingStore) protected readonly gameUserSettingStore: GameUserSettingStore,
        @inject(GameUserSettingHandler) protected readonly gameUserSettingHandler: GameUserSettingHandler,
        @inject(ShoePFHandler) protected readonly shoePFHandler: ShoePFHandler,
        @inject(ShoeStore) protected readonly shoeStore: ShoeStore,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore
    ) {
        when(() => this.mainPlayerStore.readyUserInfo, () => {
            this.loadClientSettingFromStorage();
        });
        reaction(
            () => this.gameUserSettingStore.permanentStorage,
            (trigger) => {
                if (trigger?.action === GameUserSettingAction.Save) {
                    this.onSaveStorage();
                }
            }
        );
    }

    get permanentStorageKey() {
        return `${localStorageKeys.permanentGameUserSetting}-${this.mainPlayerStore.UID}-${this.mainPlayerStore.currencyGroup}`;
    }

    loadClientSettingFromStorage() {
        const data = StorageManager.get(this.permanentStorageKey) as FairnessUserSetting;
        if (data && data?.clientSeed) {
            this.fairnessStore.clientSeed = data.clientSeed;
        } else {
            this.generateClientSeed();
        }
        if (data && data?.dontShowAgain) {
            this.fairnessStore.dontShowAgain = data.dontShowAgain;
        } else {
            this.fairnessStore.dontShowAgain = false;
        }
    }

    saveClientSeed(clientSeed: string) {
        this.fairnessStore.clientSeed = clientSeed;
        this.saveStorage();
    }

    private saveStorage() {
        this.gameUserSettingHandler.savePermanentStorage();
    }

    /**
     * call from UI component, dont remove it*/
    setMinClientSeed(min: number) {
        this.fairnessStore.minClientSeed = min;
    }

    /**
     * call from UI component, dont remove it*/
    setMaxClientSeed(max: number) {
        this.fairnessStore.maxClientSeed = max;
    }

    generateClientSeed() {
        if (this.fairnessStore.minClientSeed === 0 || this.fairnessStore.maxClientSeed === 0) {
            return;
        }
        this.fairnessStore.clientSeed = this.randomClientSeedValue();
    }

    private randomClientSeedValue(): string {
        return _.random(this.fairnessStore.minClientSeed, this.fairnessStore.maxClientSeed).toString();
    }

    onSaveStorage() {
        const currentSetting = (StorageManager.get(this.permanentStorageKey) || {}) as FairnessUserSetting;
        currentSetting.clientSeed = this.fairnessStore.clientSeed;
        currentSetting.dontShowAgain = this.fairnessStore.dontShowAgain;

        StorageManager.set(this.permanentStorageKey, currentSetting);
    }

    handleShowFairnessSettingsPopup(isShow: boolean) {
        const isCutCardPhase = !this.shoeStore.shoeInfo?.cutCardIndex;

        this.fairnessStore.isShowFairnessSettingsPopup = isShow && isCutCardPhase;
        if (!isShow) {
            this.fairnessStore.showWaitingScreen = isCutCardPhase;
        }
    }

    updateDontShowAgain(isShow: boolean) {
        this.fairnessStore.dontShowAgain = isShow;
        this.saveStorage();
    }

    openVerificationHistory(roundId: number) {
        this.shoePFHandler.requestRoundPF(roundId);
        this.fairnessStore.openVerification = { isOpen: true, roundId };
    }

    closeVerification() {
        this.fairnessStore.openVerification = { isOpen: false };
    }

    openCutCardIndex(roundId: number) {
        this.fairnessStore.openCutCardIndex = { isOpen: true, roundId };
    }

    closeCutCardIndex() {
        this.fairnessStore.openCutCardIndex = { isOpen: false };
    }

    sendClientSeed(clientSeed: string) {
        this.fairnessStore.clientSeed = clientSeed;
        this.connectionStore.send(GameClientEmitMessage.CutCard.eventName, { cutCardIndex: this.fairnessStore.clientSeed });
    }

    resetCutCardInfo() {
        this.fairnessStore.cutCardInfo = null;
    }
}
