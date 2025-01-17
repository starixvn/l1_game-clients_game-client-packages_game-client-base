import { inject, injectable } from "inversify";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { GameConfigStore } from "../game-configs/game-config-store";

@injectable()
export class OddsHandlers implements IMultipleHandlers {
    constructor(@inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore) {}

    handle(odds: GameServiceMessage.GameOdds) {
        odds?.values && this.gameConfigStore.setOdds(odds.values);
        this.gameConfigStore.setBoostedChoices(odds?.boostedChoices);
    }

    eventHandleList = [
        {
            name: GameServiceMessage.GameOdds.eventName,
            handle: this.handle,
        },
    ];
}
