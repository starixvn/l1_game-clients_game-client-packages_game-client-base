import { inject, injectable } from "inversify";
import * as _ from "lodash";
import { BlackjackActions, BlackjackServiceMessages } from "../blackjack-service-messages";
import { IMultipleHandlers } from "../../shared";
import { RoundStore } from "./round-store";
import { HandsStore } from "../hands";
import { DealerStore } from "../dealer";

@injectable()
export class RoundHandlers implements IMultipleHandlers {
    constructor(
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(DealerStore) protected readonly dealerStore: DealerStore
    ) {}

    handleOwnBets(data: BlackjackServiceMessages.OwnBets) {
        if (!_.isEmpty(data)) {
            this.roundStore.isRunning = true;
            this.roundStore.roundId = data.roundId;
            this.handsStore.setHands(data.hands);
            this.dealerStore.setCards(data.dealer);
            this.roundStore.action = BlackjackActions.RUNNING;
        }
    }

    eventHandleList = [{ name: BlackjackServiceMessages.OwnBets.eventName, handle: this.handleOwnBets }];
}
