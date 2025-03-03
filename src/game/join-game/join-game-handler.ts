import { inject, injectable } from "inversify";
import { GameServiceMessage } from "../../shared";
import { IHandler } from "../../shared/mediator";
import { JoinGameStore } from "./join-game-store";
import { AppStore } from "../../app/app-store";

@injectable()
export class JoinGameHandler implements IHandler<string> {
    name = GameServiceMessage.toGame;
    constructor(
        @inject(JoinGameStore) protected readonly joinGameStore: JoinGameStore,
        @inject(AppStore) protected readonly appStore: AppStore
    ) {}

    async handle(toGame: string) {
        this.joinGameStore.toGame = {
            name: toGame,
        };

        this.appStore.isLoading = false;
    }
}
