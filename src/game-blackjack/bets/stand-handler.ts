import { injectable } from "inversify";
import { ActionHandlerBase } from "./action-handler-base";
import { BlackjackActions } from "../blackjack-service-messages";

@injectable()
export class StandHandler extends ActionHandlerBase {
    protected action = BlackjackActions.SEND_STAND;

    createBetData() {
        const data = super.createBetData();
        data.stand = { id: this.handsStore.activeHandId };
        return data;
    }
}
