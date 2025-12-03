import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { NoticeStore } from "../game/notices/notice-store";
import { GameServiceMessage } from "../shared";
import { Translator } from "../shared/utils";

export interface IStakeLevel {
    minBet: number;
    maxBet: number;
}

@injectable()
export class MainPlayerStore {
    constructor(
        @inject(NoticeStore)
        protected readonly noticeStore: NoticeStore
    ) {
        makeAutoObservable(this);
    }

    stakeLevel: IStakeLevel = { minBet: 0, maxBet: 0 };
    UID = 0;
    name = "";
    balance = 0;
    avatarId = 1;
    ss = "";
    system = 1;
    operatorName: string;
    rate = 1;
    scoin = 0;
    currency = "";
    currencyCode = "";
    currencyGroup = "";
    availSpins?: number = 0;
    fractionalOddsFormat = false;
    displayPlayerCurrency = true;
    disableJackpotGames = false;
    offerGames?: { gameId: number }[] = null;
    browserUserAgent = "";
    multiplier = 1;
    xMode = 1;

    get readyUserInfo() {
        return this.UID !== 0 && this.currencyGroup !== "";
    }

    setAuthorizeStore(user: GameServiceMessage.User) {
        this.UID = user.UID;
        this.name = user.name;
        this.avatarId = user.avatarId;
        this.setBalance(user.red, user.scoins, user.availSpins);
        this.currency = user.currency;
        this.currencyCode = user.currencyCode;
        this.currencyGroup = user.currencyGroup;
        this.offerGames = user.offerGames;
        this.fractionalOddsFormat = user.fractionalOddsFormat;
        this.displayPlayerCurrency = user.isDisplayPlayerCurrency;
        this.disableJackpotGames = user.disableJackpotGames;
        this.rate = user.rate;
        this.multiplier = user.multiplier;
        this.xMode = user.xMode ?? 1;
    }

    setBalance(balance: number, scoin: number, availSpins: number) {
        this.balance = balance ?? 0;
        scoin && (this.scoin = scoin);
        availSpins && (this.availSpins = availSpins);
    }

    setStakeLevel(stakeLevel: GameServiceMessage.UserStakeLevel) {
        stakeLevel && (this.stakeLevel = stakeLevel);
    }

    showNoticeChangeStakeLevel(stakeLevel: GameServiceMessage.UserStakeLevel, currentStakeLevel: IStakeLevel) {
        if (
            currentStakeLevel?.minBet > 0 &&
            currentStakeLevel?.maxBet > 0 &&
            (stakeLevel?.minBet !== currentStakeLevel?.minBet || stakeLevel?.maxBet !== currentStakeLevel?.maxBet)
        ) {
            this.noticeStore.addWarning(Translator.commonTranslate("message_bet_limit_change"));
        }
    }
}
