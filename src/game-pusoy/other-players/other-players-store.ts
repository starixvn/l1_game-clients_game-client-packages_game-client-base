import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { PusoyServiceMessages } from "../pusoy-service-messages";
import { NumberUtils } from "../../shared/utils/number-utils";
import { MainPlayerStore } from "../../players/main-player-store";

@injectable()
export class OtherPlayersStore {
    otherPlayers: PusoyServiceMessages.OtherPlayer[] = [];

    constructor(@inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore) {
        makeAutoObservable(this);
    }

    setOtherPlayers(players: PusoyServiceMessages.OtherPlayer[]) {
        players.forEach((player) => {
            player.red = NumberUtils.getValueByCurrency(player.red, this.mainPlayerStore.rate, player.rate);
        });
        this.otherPlayers = players;
    }
}
