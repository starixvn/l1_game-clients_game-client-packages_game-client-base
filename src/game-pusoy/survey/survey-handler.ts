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

    handleUpdateSurveyStatus(survey: PusoyServiceMessages.SurveyStatus) {
        this.surveyStore.setSurveyStatus(survey.surveyUpdated);
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.SurveyStatus.eventName,
            handle: this.handleUpdateSurveyStatus,
        },
    ];
}
