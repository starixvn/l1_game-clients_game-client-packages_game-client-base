import { inject, injectable } from "inversify";
import { ConnectionStore } from "../../game/connection";
import { PusoyClientMessages, PusoyServiceMessages } from "../pusoy-service-messages";
import { SurveyStore } from "./survey-store";

@injectable()
export class SurveyHandler {
    constructor(
        @inject(ConnectionStore) private readonly connectionStore: ConnectionStore,
        @inject(SurveyStore) private readonly surveyStore: SurveyStore
    ) {}

    sendSurveyToServer(wishToPlayWithRealMoney = false) {
        this.connectionStore.send(PusoyClientMessages.survey, { wishToPlayWithRealMoney });
    }

    handleUpdateSurveyStatus(status: boolean) {
        this.surveyStore.setSurveyStatus(status);
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.SurveyStatus.eventName,
            handle: this.handleUpdateSurveyStatus,
        },
    ];
}
