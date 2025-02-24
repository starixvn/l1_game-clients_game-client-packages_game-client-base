import { inject, injectable } from "inversify";
import { HandsStore } from "./hands-store";
import { BetStore } from "../../game/bets/bet-store";
import { RoundStore } from "../rounds";
import { MainPlayerStore } from "../../players";
import { GameSetting } from "../../game/game-configs";
import { NoticeStore } from "../../game/notices";
import { Translator } from "../../shared/utils";

@injectable()
export class HandHandlers {
    constructor(
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(GameSetting) protected readonly gameSetting: GameSetting,
        @inject(NoticeStore) protected readonly noticeStore: NoticeStore
    ) {}

    placeChip(position: number, amount = 0) {
        const betAmount = amount || this.betStore.amount;
        const currentTotalBetAmount = this.handsStore.totalBetAmount;
        if (this.isValidBet(betAmount + currentTotalBetAmount)) {
            this.handsStore.placeChip(position, betAmount);
            return true;
        }
        return false;
    }

    setActiveHand() {
        this.handsStore.setActiveHand();
    }

    clearChip(position: number) {
        this.handsStore.clearChip(position);
    }

    private isValidBet(amount: number) {
        if (this.betStore.isProcessingBet) {
            this.showWarningProcessingBet();
        }
        const isReachMaxBet = amount > this.roundStore.maxBet;
        if (isReachMaxBet) {
            this.showWarningReachLimitBet(true);
            return false;
        }
        const isReachMinBet = amount < this.roundStore.minBet;
        if (isReachMinBet) {
            this.showWarningReachLimitBet(false);
            return false;
        }
        if (amount > this.betStore.availableBalance) {
            this.showNoticeNotEnoughBalance();
            return false;
        }
        return true;
    }

    private showWarningProcessingBet() {
        this.noticeStore.addProcessWarning(Translator.commonTranslate("message_processing_action"));
    }

    private showNoticeNotEnoughBalance() {
        const message = this.betStore.freebetEnabled
            ? Translator.commonTranslate("not_enough_scoin")
            : Translator.commonTranslate("not_enough_money");
        this.noticeStore.addWarning(message);
    }

    private showWarningReachLimitBet(isReachMaxBet: boolean) {
        const key = isReachMaxBet ? "max_stake_hand" : "min_bet_hand";
        const params = isReachMaxBet ? { maxBet: this.roundStore.maxBet } : { minBet: this.roundStore.minBet };
        this.noticeStore.addProcessWarning(Translator.commonTranslate(key, params));
    }
}
