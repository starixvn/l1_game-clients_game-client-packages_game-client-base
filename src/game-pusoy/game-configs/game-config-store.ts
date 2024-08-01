import { inject, injectable } from "inversify";
import { GameServiceMessage } from "../../shared";
import { RoundStore, RoundTimeStore } from "../rounds";
import { makeAutoObservable } from "mobx";

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
export class GameConfigStore {
    stakeLevels: string[] = [];
    initialized = false;
    durations: any = {};
    suitesMapper: { [key: string]: string } = {};
    scoreConfig: any = {};

    constructor(
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore
    ) {
        makeAutoObservable(this);
    }

    setGameConfigs(gameConfigs: PusoyGameConfigs) {
        if (gameConfigs) {
            if (gameConfigs.enableFreeBet === undefined) {
                gameConfigs.enableFreeBet = false;
            }
            Object.assign(this, gameConfigs);
            this.roundTimeStore.configure(gameConfigs.durations.timeline);
            this.roundStore.setSuitesMapper(gameConfigs.suitesMapper);
            this.initialized = true;
        }
    }
}
