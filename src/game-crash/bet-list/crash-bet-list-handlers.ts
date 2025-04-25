import { inject, injectable } from "inversify";
import { reaction } from "mobx";

import { BetStore, ILastReceivedBet } from "../../game/bets/bet-store";
import { RoundTimeStore } from "../../game/rounds/round-time-store";
import { MainPlayerStore } from "../../players/main-player-store";
import { GameServiceMessage, IMultipleHandlers } from "../../shared";
import { NumberUtils } from "../../shared/utils/number-utils";
import { CrashCashOutStore } from "../cash-out/crash-cash-out-store";
import { GameCrashServiceMessage, LeaderBoardPlayer } from "../game-crash-messages";
import { CrashBetListStore, ICrashBetList } from "./crash-bet-list-store";

@injectable()
export class CrashBetListHandlers implements IMultipleHandlers {
    constructor(
        @inject(MainPlayerStore) protected readonly mainPlayerStore: MainPlayerStore,
        @inject(CrashCashOutStore) protected readonly crashCashOutStore: CrashCashOutStore,
        @inject(RoundTimeStore) protected readonly roundTimeStore: RoundTimeStore,
        @inject(BetStore) protected readonly betStore: BetStore,
        @inject(CrashBetListStore) protected readonly betListStore: CrashBetListStore
    ) {
        reaction(() => this.roundTimeStore.isStartRound, this.reactionStartRound.bind(this));
        reaction(() => this.betStore.lastReceivedBet, this.reactionLastReceivedBet.bind(this));
        reaction(() => this.crashCashOutStore.halfCashOut, this.reactionHalfCashOut.bind(this));
        reaction(() => this.crashCashOutStore.cashOut, this.reactionCashOut.bind(this));
    }

    protected reactionStartRound(isStartRound: boolean) {
        if (!isStartRound) {
            return;
        }

        this.resetLeaderBoard();
    }

    protected reactionLastReceivedBet(lastReceivedBet: ILastReceivedBet) {
        if (!lastReceivedBet || lastReceivedBet.value <= 0) {
            return;
        }

        const player = {
            name: this.mainPlayerStore.name,
            amount: lastReceivedBet.value,
        };
        this.betListStore.mainPlayer = player;
    }

    protected reactionHalfCashOut(halfCashOut: GameCrashServiceMessage.CrashCashOut) {
        if (!halfCashOut) {
            return;
        }
        const { name, amount } = this.betListStore.mainPlayer;
        const player = { name, amount, halfCashOut };
        this.betListStore.mainPlayer = player;
    }

    protected reactionCashOut(cashOut: GameCrashServiceMessage.CrashCashOut) {
        if (!cashOut) {
            return;
        }

        const { name, amount, halfCashOut } = this.betListStore.mainPlayer;
        const player = { name, amount, halfCashOut, cashOut };
        this.betListStore.mainPlayer = player;
    }

    private sortDecreasedBetAmount(betPlayers: LeaderBoardPlayer[]) {
        return betPlayers.sort((player1, player2) => player2.amount - player1.amount);
    }

    private sortByMultiplierBetAmount(newPlayers: LeaderBoardPlayer[]) {
        const cashOutPlayers = this.sortPlayersByMultiplier(newPlayers);
        const notCashOutPlayers = this.sortPlayersByBetAmount(newPlayers);
        cashOutPlayers.push(...notCashOutPlayers);

        return cashOutPlayers;
    }

    private playerHasCashedOut(player: LeaderBoardPlayer) {
        return player.multiplier > 0;
    }

    private sortPlayersByBetAmount(players: LeaderBoardPlayer[]) {
        const list = players.filter((player) => !this.playerHasCashedOut(player));
        return this.sortDecreasedBetAmount(list);
    }

    private sortPlayersByMultiplier(newPlayers: LeaderBoardPlayer[]) {
        const list = newPlayers.filter((player) => this.playerHasCashedOut(player));
        list.sort((player1, player2) => player2.multiplier - player1.multiplier);

        return list;
    }

    private generateLeaderBoardPlayers(data: ICrashBetList): LeaderBoardPlayer[] {
        const players: LeaderBoardPlayer[] = [];
        Object.keys(data).forEach((key) => {
            const player = data[key];
            this.generateLeaderBoardPlayer(players, player);
        });

        return players;
    }

    private generateLeaderBoardPlayer(players: LeaderBoardPlayer[], player: GameCrashServiceMessage.CrashOtherPlayer) {
        const { amount, rate, halfCashOut, cashOut, playerId, name } = player;
        const newPlayer: LeaderBoardPlayer = {
            playerId,
            name,
            amount,
            win: 0,
            multiplier: 0,
        };

        newPlayer.amount = NumberUtils.getValueByCurrency(amount, this.mainPlayerStore.rate, rate);
        if (cashOut) {
            this.convertAmountAndWinValue(cashOut, rate);
            this.updateCashOutRow(newPlayer, cashOut);
        }
        if (halfCashOut) {
            this.convertAmountAndWinValue(halfCashOut, rate);

            const halfCashOutPlayer = this.updateAmountAndAddHalfCashOut(newPlayer, halfCashOut);
            players.push(halfCashOutPlayer);
        }
        players.push(newPlayer);
    }

    convertAmountAndWinValue(cashOut: GameCrashServiceMessage.CashOutReceive, rate: number) {
        const { amount, win } = cashOut;

        cashOut.win = NumberUtils.getValueByCurrency(win, this.mainPlayerStore.rate, rate);
        cashOut.amount = NumberUtils.getValueByCurrency(amount, this.mainPlayerStore.rate, rate);
    }

    private resetLeaderBoard() {
        this.betListStore.otherPlayers = [];
        this.betListStore.mainPlayer = null;
    }

    handleNewOtherCashOut(otherPlayer: GameCrashServiceMessage.CrashOtherPlayer) {
        const { playerId, halfCashOut, cashOut } = otherPlayer;
        const notCashedOut = this.betListStore.otherPlayers.find(
            (player) => player.playerId === playerId && !this.playerHasCashedOut(player)
        );

        if (!notCashedOut) {
            return;
        }

        if (halfCashOut) {
            const newHalfCashOutPlayer = this.updateAmountAndAddHalfCashOut(notCashedOut, halfCashOut);
            this.betListStore.otherPlayers.push(newHalfCashOutPlayer);
        } else if (cashOut) {
            this.updateCashOutRow(notCashedOut, cashOut);
        }

        this.betListStore.otherPlayers = this.sortByMultiplierBetAmount(this.betListStore.otherPlayers);
    }

    private updateCashOutRow(notCashedOutRow: LeaderBoardPlayer, cashOut: GameCrashServiceMessage.CashOutReceive) {
        notCashedOutRow.amount = cashOut.amount;
        notCashedOutRow.win = cashOut.win;
        notCashedOutRow.multiplier = cashOut.multiplier;
    }

    private updateAmountAndAddHalfCashOut(notCashedOutRow: LeaderBoardPlayer, halfCashOut: GameCrashServiceMessage.CashOutReceive) {
        const { amount } = halfCashOut;
        notCashedOutRow.amount = amount;

        return this.createHalfCashOut(notCashedOutRow, halfCashOut);
    }

    private createHalfCashOut(notCashedOutRow: LeaderBoardPlayer, halfCashOut: GameCrashServiceMessage.CashOutReceive) {
        return { ...notCashedOutRow, ...halfCashOut };
    }

    private handleBetList(betList: ICrashBetList) {
        const list = this.generateLeaderBoardPlayers(betList);
        this.betListStore.otherPlayers = this.sortByMultiplierBetAmount(list);
    }

    private handlePlayerChip(playerChip: GameServiceMessage.PlayerChip) {
        const newPlayerBet: LeaderBoardPlayer = this.convertCurrencyForPlayerChip(playerChip);
        this.betListStore.otherPlayers.push(newPlayerBet);

        this.betListStore.otherPlayers = this.sortPlayersByBetAmount(this.betListStore.otherPlayers);
    }

    private convertCurrencyForPlayerChip(playerChip: GameServiceMessage.PlayerChip): LeaderBoardPlayer {
        const { amount, rate, playerId, name } = playerChip;
        return {
            playerId,
            name,
            amount: NumberUtils.getValueByCurrency(amount, this.mainPlayerStore.rate, rate),
            multiplier: 0,
            win: 0,
        };
    }

    eventHandleList = [
        {
            name: GameCrashServiceMessage.BetList.eventName,
            handle: this.handleBetList,
        },
        {
            name: GameServiceMessage.PlayerChip.eventName,
            handle: this.handlePlayerChip,
        },
    ];
}
