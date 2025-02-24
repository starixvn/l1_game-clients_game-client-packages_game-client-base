import { inject, injectable } from "inversify";
import { BetStore } from "../../../game/bets/bet-store";
import { ConnectionHandlers } from "../../../game/connection";
import { IMultipleHandlers } from "../../../shared";
import { RoundStore } from "../../rounds";
import { BlackjackActions, BlackjackServiceMessages } from "../../blackjack-service-messages";
import { HandsStore } from "../../hands";
import { DealerStore } from "../../dealer";

@injectable()
export class SplitResponseHandlers implements IMultipleHandlers {
    constructor(
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(DealerStore) protected readonly dealerStore: DealerStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler
    ) {}

    handleSplitResponse(data: BlackjackServiceMessages.Split) {
        this.roundStore.isRunning = true;
        data.hands.forEach((hand) => this.handsStore.setHand(hand));
        this.roundStore.action = BlackjackActions.SPLIT;
    }

    eventHandleList = [{ name: BlackjackServiceMessages.Split.eventName, handle: this.handleSplitResponse }];
}
