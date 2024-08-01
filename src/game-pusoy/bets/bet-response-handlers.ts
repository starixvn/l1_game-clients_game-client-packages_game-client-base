import { injectable } from "inversify";

import { BetResponseHandlers as BaseBetResponseHandlers } from "../../game/bets";

@injectable()
export class BetResponseHandlers extends BaseBetResponseHandlers {
    declare roundTimeStore: any;

    handleBetResponse(endBet: number) {
        this.stopProcessingBetAndClearInterval();
        this.betStore.lastReceivedBet = { value: endBet, isAnimated: true };

        if (endBet !== -1) {
            console.log("Start round success: waiting for deal hand");
        } else {
            console.log("Cannot start round: failed bet");
        }
    }
}
