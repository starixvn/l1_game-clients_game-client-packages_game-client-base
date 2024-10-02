import { PusoyServiceMessages } from "../pusoy-service-messages";
import { inject, injectable } from "inversify";
import { IMultipleHandlers } from "../../shared";
import { OtherPlayersStore } from "./other-players-store";
import { RoundTimeStore } from "../rounds";

@injectable()
export class OtherPlayersHandlers implements IMultipleHandlers {
    constructor(
        @inject(OtherPlayersStore) protected readonly otherPlayersStore: OtherPlayersStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore
    ) {}

    handleOtherPlayers(otherPlayers: PusoyServiceMessages.OtherPlayer[]) {
        this.otherPlayersStore.setOtherPlayers(otherPlayers);

        if (otherPlayers.length === 0) {
            this.roundTimeStore.pause();
        } else {
            this.roundTimeStore.play();
        }
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.OtherPlayers.eventName,
            handle: this.handleOtherPlayers,
        },
    ];
}
