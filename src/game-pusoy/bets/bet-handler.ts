import { injectable } from "inversify";
import { BetHandlerBase } from "../../game/bets/bet-handler-base";
import { TimelineKey } from "../rounds";

@injectable()
export class BetHandler extends BetHandlerBase {
    declare roundTimeStore: any;

    handle(betChoice: string) {
        const betData = this.createBetData({ betChoice });
        this.handleBetData(betData);
    }

    isValidBet(amount: number) {
        if (this.isInPhaseBet()) {
            return false;
        }

        if (this.betStore.isProcessingBet) {
            return false;
        }

        return true;
    }

    isInPhaseBet() {
        return this.roundTimeStore.in(TimelineKey.transition);
    }
}
