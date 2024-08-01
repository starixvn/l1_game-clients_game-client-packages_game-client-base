import { injectable } from "inversify";
import { BetHandlerBase } from "../../game/bets/bet-handler-base";
import { GameClientEmitMessage } from "../../shared";
import { PusoyServiceMessages } from "../pusoy-service-messages";
import { TimelineKey } from "../rounds/round-time-store";

@injectable()
export class BetHandler extends BetHandlerBase {
    declare roundTimeStore: any;

    handle(betChoice: string) {
        const betData = this.createBetData({ betChoice });
        this.handleBetData(betData);
    }

    handleBetData(data: any) {
        const amount = data.amount;
        if (this.isValidBet(amount)) {
            this.betStore.isProcessingBet = true;
            this.roundTimeStore.pause();
            this.connectionStore.send(GameClientEmitMessage.Bet.eventName, data);
            this.retryGameHandler.handle();
        }
    }

    isValidBet(amount: number) {
        if (!this.isInPhaseBet()) {
            return false;
        }

        if (this.betStore.isProcessingBet) {
            return false;
        }

        return true;
    }

    isInPhaseBet() {
        return this.roundTimeStore.in(TimelineKey.transition) || this.roundTimeStore.in(TimelineKey.deal);
    }

    handleStartDeal(startDeal: boolean) {
        if (startDeal) {
            this.roundTimeStore.play();
        }
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.StartDeal.eventName,
            handle: this.handleStartDeal,
        },
    ];
}
