import { inject, injectable } from "inversify";
import { BetStore } from "../../../game/bets/bet-store";
import { ConnectionHandlers } from "../../../game/connection";
import { IMultipleHandlers } from "../../../shared";
import { RoundStore } from "../../rounds";
import { BlackjackActions, BlackjackServiceMessages } from "../../blackjack-service-messages";
import { HandsStore } from "../../hands";
import { DealerStore } from "../../dealer";

@injectable()
export class HitResponseHandlers implements IMultipleHandlers {
    constructor(
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore,
        @inject(HandsStore) protected readonly handsStore: HandsStore,
        @inject(DealerStore) protected readonly dealerStore: DealerStore,
        @inject(ConnectionHandlers.RetryGameHandler) protected readonly retryGameHandler: ConnectionHandlers.RetryGameHandler
    ) {}

    handleHitResponse(data: BlackjackServiceMessages.Hit) {
        this.setData(data);
        this.roundStore.action = BlackjackActions.HIT;
    }

    handleDoubleResponse(data: BlackjackServiceMessages.Double) {
        this.setData(data);
        this.roundStore.action = BlackjackActions.DOUBLE;
    }

    setData(data: BlackjackServiceMessages.Hit | BlackjackServiceMessages.Double) {
        this.roundStore.isRunning = true;
        this.handsStore.setHand(data);
    }

    eventHandleList = [
        { name: BlackjackServiceMessages.Hit.eventName, handle: this.handleHitResponse },
        { name: BlackjackServiceMessages.Double.eventName, handle: this.handleDoubleResponse },
    ];
}
