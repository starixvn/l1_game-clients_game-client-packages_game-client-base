import { injectable } from "inversify";
import { ActionHandlerBase } from "./action-handler-base";
import { BlackjackActions } from "../blackjack-service-messages";

@injectable()
export class DoubleHandler extends ActionHandlerBase {
    protected action = BlackjackActions.SEND_DOUBLE;

    createBetData() {
        const data = super.createBetData();
        data.double = { id: this.handsStore.activeHandId };
        return data;
    }
}
