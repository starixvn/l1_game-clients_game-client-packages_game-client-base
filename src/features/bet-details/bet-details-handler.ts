import { inject, injectable } from "inversify";
import { ConnectionStore } from "../../game/connection/connection-store";
import { GameClientEmitMessage, GameServiceMessage, IMultipleHandlers } from "../../shared";
import { BetDetailsStore } from "./bet-details-store";

@injectable()
export class BetDetailsHandler implements IMultipleHandlers {
    constructor(
        @inject(BetDetailsStore) protected readonly betDetailsStore: BetDetailsStore,
        @inject(ConnectionStore) protected readonly connectionStore: ConnectionStore
    ) { }

    eventHandleList = [
        {
            name: GameServiceMessage.BetDetails.eventName,
            handle: this.handleBetDetails,
        },
    ];

    handleBetDetails(url: string) {
        this.betDetailsStore.betDetailsUrl = url;
    }

    openBetDetails(payload: any) {
        this.connectionStore.send(GameClientEmitMessage.HistoryBetDetails.eventName, payload);
    }
}
