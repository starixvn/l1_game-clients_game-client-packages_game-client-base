import { injectable } from "inversify";
import { ActionHandlerBase } from "./action-handler-base";
import { BlackjackActions } from "../blackjack-service-messages";

@injectable()
export class SplitHandler extends ActionHandlerBase {
    protected action = BlackjackActions.SEND_SPLIT;
    createBetData() {
        const data = super.createBetData();
        data.split = { id: this.handsStore.activeHandId };
        return data;
    }
}
