import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { GameServiceMessage } from "../../shared";
import { Notice } from "../notices";
@injectable()
export class DisabledGameStore {
    disabled = false;
    showPopup = false;
    disableGameInfo: GameServiceMessage.DisabledGameInfo = null;
    noticeDisable: Notice = null;

    _isResetRoundTime = false;

    constructor() {
        makeAutoObservable(this);
    }

    setGameStatus(disabled: boolean) {
        this.disabled = disabled;
    }

    setShowPopup(showPopup: boolean) {
        this.showPopup = showPopup;
    }

    setDisableGameInfo(info: GameServiceMessage.DisabledGameInfo) {
        this.disableGameInfo = info;
    }

    setNoticeDisable(notice: Notice) {
        this.noticeDisable = notice;
    }

    get isResetRoundTime() {
        return this._isResetRoundTime;
    }

    set isResetRoundTime(isReset: boolean) {
        this._isResetRoundTime = isReset;
    }

}
