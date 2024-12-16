import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { GameServiceMessage } from "../../shared";
@injectable()
export class DisabledGameStore {
    disabled = false;
    showPopup = false;
    disableGameInfo: GameServiceMessage.DisabledGameInfo = null;

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
}
