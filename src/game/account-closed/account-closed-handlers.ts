import { inject, injectable } from "inversify";
import { AuthStore } from "../../auth";
import { GameServiceMessage, IHandler } from "../../shared";

@injectable()
export class AccountClosedHandlers implements IHandler<GameServiceMessage.AccountClosed> {
    name = GameServiceMessage.AccountClosed.eventName;
    constructor(@inject(AuthStore) private readonly authStore: AuthStore) { }

    handle(accountCloseInfo: GameServiceMessage.AccountClosed) {
        if (accountCloseInfo.isDisabledAccount) {
            this.authStore.setAccountClosed(accountCloseInfo.errorCode);
        }
    }
}
