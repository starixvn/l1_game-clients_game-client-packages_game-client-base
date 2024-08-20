import { PusoyServiceMessages } from "../pusoy-service-messages";
import { inject, injectable } from "inversify";
import { IMultipleHandlers } from "../../shared";
import { OtherPlayersStore } from "./other-players-store";
import { RoundStore } from "../rounds";

@injectable()
export class OtherPlayersHandlers implements IMultipleHandlers {
    constructor(
        @inject(OtherPlayersStore) protected readonly otherPlayersStore: OtherPlayersStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore
    ) {}

    handleOtherPlayers(otherPlayers: PusoyServiceMessages.OtherPlayer[]) {
        this.otherPlayersStore.setOtherPlayers(otherPlayers);
        this.roundStore.otherPlayers = otherPlayers;
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.OtherPlayers.eventName,
            handle: this.handleOtherPlayers,
        },
    ];
}
