import { PusoyServiceMessages } from "../pusoy-service-messages";
import { inject, injectable } from "inversify";
import { IMultipleHandlers } from "../../shared";
import { OtherPlayersStore } from "./other-players-store";

@injectable()
export class OtherPlayersHandlers implements IMultipleHandlers {
    constructor(@inject(OtherPlayersStore) protected readonly aroundTablePlayersStore: OtherPlayersStore) {}

    handlePlayers(aroundTablePlayers: PusoyServiceMessages.OtherPlayer[]) {
        this.aroundTablePlayersStore.setOtherPlayers(aroundTablePlayers);
    }

    eventHandleList = [
        {
            name: PusoyServiceMessages.OtherPlayers.eventName,
            handle: this.handlePlayers,
        },
    ];
}
