import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

@injectable()
export class SurveyStore {
    statusUpdated = false;
    openSurveyPopup = false;

    constructor() {
        makeAutoObservable(this);
    }

    setSurveyStatus(status: boolean) {
        this.statusUpdated = status;
    }

    setOpenSurveyPopup(open: boolean) {
        this.openSurveyPopup = open;
    }
}
