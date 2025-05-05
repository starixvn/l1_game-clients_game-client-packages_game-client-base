import { inject, injectable } from "inversify";
import { GameClientEmitMessage, IHandler } from "../../shared";
import { GameConfigStore } from "../game-configs/game-config-store";
import { RoundRunningHandlers } from "../rounds";
import { ConnectionStore } from "./connection-store";

import { ISocketOption } from "./connection-store-base";
import { ConnectionTrialStore } from "./connection-trial-store";

export namespace ConnectionHandlers {
    @injectable()
    export class ConnectHandler {
        constructor(
            @inject(ConnectionStore) protected readonly store: ConnectionStore,
            @inject(ConnectionTrialStore) protected readonly trialStore: ConnectionTrialStore
        ) {}

        handle(customizeOptions?: ISocketOption) {
            this.store.initConnection(customizeOptions);
        }

        handleTrial(customizeOptions?: ISocketOption) {
            this.trialStore.initConnection(customizeOptions);
        }
    }

    @injectable()
    export class InGameHandler implements IHandler<void> {
        constructor(
            @inject(ConnectionStore) private readonly connectionStore: ConnectionStore,
            @inject(ConnectionTrialStore) private readonly connectionTrialStore: ConnectionTrialStore,
            @inject(RoundRunningHandlers) private readonly roundRunning: RoundRunningHandlers,
            @inject(GameConfigStore) private readonly gameConfigStore: GameConfigStore
        ) {}

        handle() {
            if (this.gameConfigStore.initialized) {
                return;
            }
            this.roundRunning.stopRunner();
            this.connectionStore.send(GameClientEmitMessage.inGame, null);
        }

        handleTrial() {
            this.roundRunning.stopRunner();
            this.connectionTrialStore.send(GameClientEmitMessage.inGame, null);
        }
    }

    @injectable()
    export class RetryGameHandler implements IHandler<void> {
        private retryGameId: NodeJS.Timeout;

        constructor(@inject(ConnectionStore) private readonly connectionStore: ConnectionStore) {}

        handle() {
            this.clearInterval();
            this.retryGameId = setInterval(() => {
                this.connectionStore.send(GameClientEmitMessage.retry, null);
            }, 1000);
        }

        clearInterval() {
            this.retryGameId && clearInterval(this.retryGameId);
        }
    }
}
