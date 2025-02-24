import { inject, injectable } from "inversify";
import { IMultipleHandlers } from "../../../shared";
import { RoundStore } from "../../rounds";
import { BlackjackActions, BlackjackServiceMessages } from "../../blackjack-service-messages";
import { HandsStore } from "../../hands";
import { DealerStore } from "../../dealer";

@injectable()
export class DealResponseHandlers implements IMultipleHandlers {
    constructor(
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(DealerStore) protected readonly dealerStore: DealerStore
    ) {}

    handleDealResponse(data: BlackjackServiceMessages.Deal) {
        this.roundStore.isRunning = true;
        this.roundStore.roundId = data.roundId;
        this.handsStore.setHands(data.hands);
        this.dealerStore.setCards(data.dealer);
        this.roundStore.action = BlackjackActions.DEAL;
    }

    eventHandleList = [{ name: BlackjackServiceMessages.Deal.eventName, handle: this.handleDealResponse }];
}
