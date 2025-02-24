import { injectable } from "inversify";
import { ActionHandlerBase } from "./action-handler-base";
import { BlackjackActions } from "../blackjack-service-messages";

@injectable()
export class DealHandler extends ActionHandlerBase {
    protected action = BlackjackActions.SEND_DEAL;

    createBetData() {
        const data = super.createBetData();
        data.deal = {
            hands: Object.values(this.handsStore.hands)
                ?.map((hand) => ({ pos: hand.pos, bet: hand.bet }))
                .filter((hand) => hand.bet > 0),
        };
        return data;
    }
}
