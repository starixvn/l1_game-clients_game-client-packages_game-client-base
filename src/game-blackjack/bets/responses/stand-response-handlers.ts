import { inject, injectable } from "inversify";
import { BetStore } from "../../../game/bets/bet-store";
import { ConnectionHandlers } from "../../../game/connection";
import { IMultipleHandlers } from "../../../shared";
import { RoundStore } from "../../rounds";
import { BlackjackActions, BlackjackServiceMessages } from "../../blackjack-service-messages";
import { HandsStore } from "../../hands";
import { DealerStore } from "../../dealer";

@injectable()
export class StandResponseHandlers implements IMultipleHandlers {
    constructor(
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(DealerStore) protected readonly dealerStore: DealerStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler
    ) {}

    handleStandResponse(data: BlackjackServiceMessages.Stand) {
        this.roundStore.isRunning = true;
        this.handsStore.setHand(data);
        this.roundStore.action = BlackjackActions.STAND;
    }

    eventHandleList = [{ name: BlackjackServiceMessages.Stand.eventName, handle: this.handleStandResponse }];
}
