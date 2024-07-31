import { injectable, inject } from "inversify";
import { RoundStore } from "./round-store";
import { PusoyServiceMessages } from "../pusoy-service-messages";
import { IMultipleHandlers } from "../../shared";

@injectable()
export class RoundHandlers implements IMultipleHandlers {
    constructor(@inject(RoundStore) protected readonly store: RoundStore) {}

    handleRoundData(data: PusoyServiceMessages.RoundData) {
        this.store.roundId = data.roundId;
        this.store.playerHand = data.playerHand;
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.RoundData.eventname,
            handle: this.handleRoundData,
        },
    ];
}
