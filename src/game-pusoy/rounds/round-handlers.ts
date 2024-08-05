import { injectable, inject } from "inversify";
import { RoundStore } from "./round-store";
import { PusoyServiceMessages } from "../pusoy-service-messages";
import { IMultipleHandlers } from "../../shared";
import { MainPlayerStore } from "../../players";
import { RoundTimeStore } from "./round-time-store";

@injectable()
export class RoundHandlers implements IMultipleHandlers {
    constructor(@inject(RoundStore) protected readonly store: RoundStore) {}

    handleRoundData(data: PusoyServiceMessages.RoundData) {
        this.store.roundId = data?.roundId;
        this.store.initPlayerHand = data?.playerHand;
        this.store.submittedPlayers = data?.submittedPlayers || [];
        this.store.otherPlayers = data?.otherPlayers || [];
    }

    handleSubmittedPlayer(otherPlayer: PusoyServiceMessages.SubmittedPlayer) {
        this.store.submittedPlayers.push(otherPlayer);
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.RoundData.eventName,
            handle: this.handleRoundData,
        },
        {
            name: PusoyServiceMessages.SubmittedPlayer.eventName,
            handle: this.handleSubmittedPlayer,
        },
    ];
}
