import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
@injectable()
export class DisabledGameStore {
    disabled = false;
    showPopup = false;
    _isUM = false;

    constructor() {
        makeAutoObservable(this);
    }

    setGameStatus(disabled: boolean) {
        this.disabled = disabled;
    }

    setShowPopup(showPopup: boolean) {
        this.showPopup = showPopup;
    }

    public get isUM() {
        return this._isUM;
    }

    public set isUM(value: boolean) {
        this._isUM = value;
    }
}
