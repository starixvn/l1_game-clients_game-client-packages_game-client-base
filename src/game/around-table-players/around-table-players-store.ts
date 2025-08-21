import { inject, injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { SiteConfigs } from "../../configs";
import { GameServiceMessage } from "../../shared";
import { SystemConfigs } from "./../../configs/system-configs";
import { NumberUtils } from "../../shared/utils/number-utils";
import { MainPlayerStore } from "../../players/main-player-store";

@injectable()
export class AroundTablePlayersStore {
    constructor(
        @inject(SiteConfigs) protected readonly siteConfigs: SiteConfigs,
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore
    ) {
        makeAutoObservable(this);
    }

    aroundTablePlayer: GameServiceMessage.AroundTablePlayer = null;
    aroundTablePlayers: GameServiceMessage.AroundTablePlayers = {};
    outGamePlayerId: GameServiceMessage.RemoveAroundTablePlayer = null;
    maxBalanceDisplay = SystemConfigs.SG.maxBalanceDisplay;

    setAroundTablePlayers(players: GameServiceMessage.AroundTablePlayers) {
        const aroundTablePlayers = { ...players };
        Object.values(aroundTablePlayers).forEach((player) => {
            player.red = NumberUtils.getValueByCurrency(player.red, this.mainPlayerStore.rate, player.rate);
        });
        this.aroundTablePlayers = aroundTablePlayers;
    }

    updateMaxBalanceDisplay() {
        if (this.siteConfigs.systemType === SystemConfigs.VG.name) {
            this.maxBalanceDisplay = SystemConfigs.VG.maxBalanceDisplay;
        }
    }

    updateAroundTablePlayer(aroundTablePlayer: GameServiceMessage.AroundTablePlayer) {
        if (aroundTablePlayer?.id) {
            const player = { ...aroundTablePlayer };
            player.red = NumberUtils.getValueByCurrency(player.red, this.mainPlayerStore.rate, player.rate);
            this.aroundTablePlayer = player;
            this.aroundTablePlayers[aroundTablePlayer.id] = player;
        }
    }

    removeAroundTablePlayer(aroundTablePlayer: GameServiceMessage.OutGame) {
        if (aroundTablePlayer?.playerId) {
            this.outGamePlayerId = new GameServiceMessage.RemoveAroundTablePlayer({
                id: aroundTablePlayer.playerId
            });
            delete this.aroundTablePlayers[aroundTablePlayer.playerId];
        }
    }

    resetAroundTablePlayersStore() {
        this.aroundTablePlayer = null;
        this.aroundTablePlayers = {};
    }
}
