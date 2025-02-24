import { injectable } from "inversify";
import { ActionHandlerBase } from "./action-handler-base";
import { BlackjackActions } from "../blackjack-service-messages";

@injectable()
export class HitHandler extends ActionHandlerBase {
    protected action = BlackjackActions.SEND_HIT;

    createBetData() {
        const data = super.createBetData();
        data.hit = { id: this.handsStore.activeHandId };
        return data;
    }
}
