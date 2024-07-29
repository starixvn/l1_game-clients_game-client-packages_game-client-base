import { inject, injectable } from "inversify";
import { GameServiceMessage } from "../../shared";
import { GameConfigStore as BaseGameConfigStore } from "../../game/game-configs";
import { RoundTimeStore } from "../rounds";

export type Durations = {
    timeline: {
        transition: number;
        deal: number;
        arrangement: number;
        animation: number;
    };
    animation: {
        crack: number;
        natural: number;
        compareHands: number;
        pusoy: {
            mini: number;
            full: number;
        };
    };
};

export type PusoyGameConfigs = GameServiceMessage.GameConfigs & {
    durations: Durations;
    suitesMapper: { [key: string]: string };
};

@injectable()
export class GameConfigStore extends BaseGameConfigStore {
    durations: any;
    suitesMapper: { [key: string]: string };

    constructor(@inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore) {
        super();
    }

    setGameConfigs(gameConfigs: PusoyGameConfigs) {
        if (gameConfigs) {
            if (gameConfigs.enableFreeBet === undefined) {
                gameConfigs.enableFreeBet = false;
            }
            Object.assign(this, gameConfigs);
            this.roundTimeStore.configure(gameConfigs.durations.timeline);
            this.initialized = true;
        }
    }
}
