import { injectable } from "inversify";
import { MainPlayerHandlers } from "../../players";
import { GameServiceMessage } from "../../shared";

@injectable()
export class PusoyMainPlayerHandlers extends MainPlayerHandlers {
    handleStakeLevel(stakeLevel: GameServiceMessage.UserStakeLevel) {
        this.store.setStakeLevel(stakeLevel);
    }
}
