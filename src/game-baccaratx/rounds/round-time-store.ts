import { inject, injectable } from "inversify";
import { RoundTimeStore as RoundTimeStoreBase } from "../../game/rounds";
import { GameSetting } from "../../game/game-configs";

type ShoeGameSetting = GameSetting & { durations: { wholeShoe: number } };

interface IRoundTimeShoeStore extends RoundTimeStoreBase {
    wholeShoe: number;
    gameSetting: ShoeGameSetting;
}

@injectable()
export class RoundTimeStore extends RoundTimeStoreBase implements IRoundTimeShoeStore {
    get wholeShoe() {
        return this.gameSetting.durations.wholeShoe;
    }

    constructor(@inject(GameSetting) readonly gameSetting: ShoeGameSetting) {
        super(gameSetting);
    }

    get isShowAnimationResult(): boolean {
        return this.roundTime <= this.wholeShoe && this.roundTime > this.wholeShoe - this.generatingResult;
    }

    get isShowResult(): boolean {
        return (
            this.roundTime <= this.wholeShoe - this.generatingResult &&
            this.roundTime >= this.wholeShoe - this.generatingResult - this.showingResult
        );
    }

    protected calculateRoundStatusWhenShowResult() {
        const minTime = this.wholeShoe - this.generatingResult - this.showingResult;
        const duration = this.roundTime - minTime;

        this._remaining = duration;
        this._countdownTimer = duration;
    }
}
