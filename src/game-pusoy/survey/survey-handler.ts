import { inject, injectable } from "inversify";
import { ConnectionStore } from "../../game/connection";
import { PusoyClientMessages } from "../pusoy-service-messages";

@injectable()
export class SurveyHandler {
    constructor(@inject(ConnectionStore) private readonly connectionStore: ConnectionStore) {}

    sendSurveyToServer(wishToPlayWithRealMoney = false) {
        this.connectionStore.send(PusoyClientMessages.survey, { wishToPlayWithRealMoney });
    }
}
