import { inject, injectable } from "inversify";
import { makeAutoObservable, toJS } from "mobx";

import { MainPlayerStore } from "../../players";
import { GameServiceMessage } from "../../shared/models/game-messages";
import { NumberUtils } from "../../shared/utils";
import { GameConfigStore } from "../game-configs";
import { RoundStore } from "../rounds/round-store";
import { RoundTimeStore } from "../rounds/round-time-store";

export interface IChipGroup {
    [chipValue: string]: number;
}

interface MainPlayerChips {
    [choiceName: string]: IChipGroup;
}

export interface TChipsByMainPlayerRate {
    chips: MainPlayerChips;
    isShow: boolean;
}

export interface TChipReBet {
    betChoice: string;
    amount: number;
}
@injectable()
export class ChipStore {
    constructor(
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(GameConfigStore) protected readonly gameConfigStore: GameConfigStore,
        @inject(RoundStore) protected readonly roundStore: RoundStore
    ) {
        makeAutoObservable(this);
    }

    private _chips: GameServiceMessage.Chips = {};
    private _clientChips: MainPlayerChips = {};
    private _playerChip: GameServiceMessage.PlayerChip = null;
    private _ownChip: GameServiceMessage.OwnChip = { betChoice: "", amount: 0 };
    private _reBet: GameServiceMessage.ReBet = {};

    clearAllChips = null;

    get ownChip() {
        return this._ownChip;
    }

    set ownChip(data: GameServiceMessage.OwnChip) {
        this._ownChip = data;
    }

    get chips() {
        return toJS(this._chips);
    }

    set chips(chips: GameServiceMessage.Chips) {
        this._chips = chips;
    }

    get clientChips() {
        return this._clientChips;
    }

    set clientChips(chips) {
        this._clientChips = chips;
    }

    get playerChip() {
        if (this._playerChip) {
            const chip = { ...toJS(this._playerChip) };
            chip.red = NumberUtils.getValueByCurrency(+chip.red, this.mainPlayerStore.rate, chip.rate);
            chip.amount = NumberUtils.getValueByCurrency(+chip.amount, this.mainPlayerStore.rate, chip.rate);
            return chip;
        }
        return this._playerChip;
    }

    set playerChip(playerChip: GameServiceMessage.PlayerChip) {
        this.gameConfigStore.chips.length > 0 && (this._playerChip = playerChip);
    }

    get reBet() {
        return this._reBet;
    }

    set reBet(reBet: GameServiceMessage.ReBet) {
        this._reBet = reBet;
    }

    resetChips() {
        this._chips = {};
        this._clientChips = {};
        this._playerChip = null;
        this.ownChip = { betChoice: "", amount: 0 };
        this.clearAllChips = {};
    }

    get chipsByMainPlayerRate(): TChipsByMainPlayerRate {
        const chipsByMainPlayerRate: TChipsByMainPlayerRate = { chips: {}, isShow: true };

        if (this.roundTimeStore.isDisplayingResultState) {
            chipsByMainPlayerRate.isShow = false;
        }

        if (this.clientChips) {
            chipsByMainPlayerRate.chips = this.clientChips;
        }

        return chipsByMainPlayerRate;
    }

    convertChips() {
        const chips: MainPlayerChips = {};

        for (const rate in this.chips) {
            const chipsByChoiceName = this.chips[rate];
            const choiceNames = Object.keys(chipsByChoiceName);

            for (const name of choiceNames) {
                const chipGroup = chipsByChoiceName[name];

                if (chipGroup) {
                    const chipValueConvert = this.convertChipToPlayerRate(chipGroup, this.mainPlayerStore.rate, +rate);
                    chips[name] = chipValueConvert;
                }
            }
        }

        this.clientChips = chips;
    }

    convertChipToPlayerRate(chipGroup: IChipGroup, playerRate: number, chipRate: number) {
        const chipValueConvert: IChipGroup = {};
        for (const chipValue in chipGroup) {
            const convertChipValue = NumberUtils.getValueByCurrency(+chipValue, playerRate, chipRate);

            chipValueConvert[convertChipValue] = chipGroup[chipValue];
        }

        return chipValueConvert;
    }

    get chipValuesByStakeLevel() {
        return this.gameConfigStore.chips
            .map((chip) => +chip)
            .filter((value) => value >= this.roundStore.minBet && value <= this.roundStore.maxBet);
    }

    get collectChipsReBet() {
        const chipsReBet: TChipReBet[] = [];

        for (const choice in this.reBet) {
            if (this.reBet.hasOwnProperty(choice)) {
                const chipsGroup = this.reBet[choice];
                this.addChipsToReBet(chipsReBet, choice, chipsGroup);
            }
        }

        return chipsReBet;
    }

    addChipsToReBet(chipsReBet: TChipReBet[], choice: string, chipsGroup: IChipGroup) {
        for (const chipValue in chipsGroup) {
            if (chipsGroup.hasOwnProperty(chipValue)) {
                const quantity: number = chipsGroup[chipValue];
                this.addIndividualChips(chipsReBet, choice, chipValue, quantity);
            }
        }
    }

    addIndividualChips(chipsReBet: TChipReBet[], choice: string, chipValue: string, quantity: number) {
        for (let i = 0; i < quantity; i++) {
            chipsReBet.push({
                betChoice: choice,
                amount: +chipValue,
            });
        }
    }
}
