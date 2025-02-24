import { inject, injectable } from "inversify";
import { BetStore } from "../../../game/bets/bet-store";
import { ConnectionHandlers } from "../../../game/connection";
import { GameServiceMessage, IMultipleHandlers } from "../../../shared";
import { BlackjackServiceMessages } from "../../blackjack-service-messages";

@injectable()
export class BetResponseHandlers implements IMultipleHandlers {
    constructor(
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler
    ) {}

    handleBetResponse(endBet: number) {
        this.stopProcessingBetAndClearInterval();
        this.betStore.lastReceivedBet = { value: endBet, isAnimated: true };
    }

    stopProcessingBetAndClearInterval() {
        this.betStore.isProcessingBet = false;
        this.retryGameHandler.clearInterval();
    }

    eventHandleList = [
        {
            name: GameServiceMessage.BetResponse.eventName,
            handle: this.handleBetResponse,
        },
        { name: BlackjackServiceMessages.Hit.eventName, handle: this.stopProcessingBetAndClearInterval },
        { name: BlackjackServiceMessages.Stand.eventName, handle: this.stopProcessingBetAndClearInterval },
    ];
}
