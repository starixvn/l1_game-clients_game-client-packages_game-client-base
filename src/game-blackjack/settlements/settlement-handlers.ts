import { inject, injectable } from "inversify";
import { IMultipleHandlers } from "../../shared";
import { BlackjackActions, BlackjackServiceMessages } from "../blackjack-service-messages";
import { DealerStore } from "../dealer";
import { HandsStore } from "../hands";
import { RoundStore } from "../rounds";

@injectable()
export class SettlementHandlers implements IMultipleHandlers {
    constructor(
        @inject(DealerStore) protected readonly dealerStore: DealerStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore
    ) {}

    handleFinish(finish: BlackjackServiceMessages.Finish) {
        this.dealerStore.setCards(finish.result);
        this.handsStore.settleHands(finish.winningHands);
        this.roundStore.action = BlackjackActions.FINISH;
    }

    eventHandleList = [
        {
            name: BlackjackServiceMessages.Finish.eventName,
            handle: this.handleFinish,
        },
    ];
}
