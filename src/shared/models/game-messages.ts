import { BoostedOddsModel, PromotionModel } from "../../notification";

export namespace GameClientEmitMessage {
    export class Signin {
        isAuthenticated: boolean;
        umInfo: string;
        username: string;
        language: string;
        ss: string;
        system: number;
        memberName: string;
        isUM: boolean;
        time: string;
        currency: string;

        static eventName = "signin";
    }
    export class Bet {
        amount: number;
        username: string;
        m: number;
        freeBet: boolean;
        betChoice: string;

        static eventName = "bet";
    }

    export const inGame = "inGame";

    export class BetHistory {
        page: number;

        static eventName = "getHistory";
    }

    export const retry = "retry";
    export const reBet = "rebet";

    export class RoundPF {
        static eventName = "getRoundPF";
    }

    export class CutCard {
        static eventName = "cutCard";
    }

    export class ShoeVerification {
        static eventName = "shoeVerification";
    }

    export class HistoryBetDetails {
        roundId: number;
        mode: string;
        language: string;
        timeZoneOffset: number;
        static eventName = "betDetails";
    }
}

export namespace GameServiceMessage {
    export const toGame = "toGame";

    export class User {
        name: string;
        UID: number;
        avatarId: number;
        currency: string;
        joinedOn: string;
        red: number;
        scoins?: number;
        type: boolean;
        rate?: number;
        minBet: number;
        maxBet: number;
        offerGames?: { gameId: number }[];
        availSpins?: number;
        fractionalOddsFormat?: boolean;
        isDisplayPlayerCurrency?: boolean;
        disableJackpotGames?: boolean;

        static eventName = "user";
    }

    export class UserStakeLevel {
        minBet: number;
        maxBet: number;

        static eventName = "userStakeLevel";
    }
    export const remainingTime = "remainingTime";
    export const um = "um";
    export const notPermittedToPlay = "notPermittedToPlay";

    export const roundId = "roundId";
    export type Odds = {
        [betChoice: string]: number;
    };

    class Bets {
        [betChoice: string]: number | any;
    }

    export class OwnBets extends Bets {
        static eventName = "ownBets";
    }

    export class TotalBets extends Bets {
        static eventName = "totalBets";
    }

    export class UserBetPercentage extends Bets {
        static eventName = "userBetPercentage";
    }

    export class BetPercentage extends Bets {
        static eventName = "betPercentage";
    }

    export type MaxBetPerChoices = Odds;

    export class GameConfigs {
        minBet: number;
        maxBet: number;
        maxBetPerChoices: MaxBetPerChoices;
        chips: string[];
        stakeLevels: string[];
        odds: Odds;
        enableFreeBet: boolean;
        originalOdds?: Odds;
        boostedChoices?: Odds;

        static eventName = "gameConfigs";
    }

    export const roundHistory = "roundHistory";
    export const ownBets = "ownBets";
    export const totalBets = "totalBets";

    export class Chips {
        [rate: string]: {
            [betChoice: string]: {
                [chipValue: string]: number;
            };
        };

        static eventName = "chips";
    }

    export class OwnChip {
        betChoice: string;
        amount: number;

        static eventName = "ownChip";
    }
    export class OutGame {
        playerId: string;

        static eventName = "outgame";
    }
    export class PlayerChip {
        playerId: string;
        amount: number;
        red: number;
        name?: string;
        betChoice?: string;
        rate?: number;

        static eventName = "playerChip";
    }
    export class AroundTablePlayer {
        id: string;
        name: string;
        red: number;
        avatarId: number;
        type: boolean;
        rate?: number;

        static eventName = "player";
    }

    export class RemoveAroundTablePlayer {
        id: string;
        constructor(init?: Partial<RemoveAroundTablePlayer>) {
            Object.assign(this, init);
        }
    }

    export class AroundTablePlayers {
        [playerId: string]: AroundTablePlayer;

        static eventName = "players";
    }

    export class ResultHash {
        rawValue?: string;
        extraInfos?: any;
        hashValue?: string;

        static eventName = "resultHash";
    }

    export class SingleClientSeed {
        nickname: string;
        clientSeed: string;
    }

    export class CutCardPF {
        playerCutCards: SingleClientSeed[];
        serverCutCardIndex: number;
    }

    export class ProvablyFair {
        serverSeedHash: string;
        roundId: number;

        result?: number;
        serverSeed?: string;
        clientSeeds?: SingleClientSeed[];
        mergeClientSeed?: string;
        mergeSeed?: string;
        finalHash?: string;

        static eventName = "pf";
    }

    export class BetResponse {
        static eventName = "endBet";
    }

    export class Notice {
        errorCode: string;
        hedgeBetGroup?: string[];
        minBet?: number;
        maxBet?: number;
        gameRoundId?: number;
        gameTypeId?: number;
        isPlaceBetFailed?: boolean;
        static eventName = "notice";
    }

    export class ApiError extends Notice {
        static eventName = "apiError";
    }

    export const betChoice = "betChoice";
    export const freeBet = "freeBet";
    export type WinningByChoices = Odds;

    export class Status {
        winningByChoices: WinningByChoices;
        win: boolean;
        bet: number;
        reachMaxWin?: boolean;

        static eventName = "status";
    }
    export class Finish {
        result?: TResult;
        settlementResult?: TSettlementResult;
        roundId?: number;
        winningPlayers?: TWinningPlayers;
        md5Result?: GameServiceMessage.ResultHash;
        pf?: GameServiceMessage.ProvablyFair;

        static eventName = "finish";
    }

    export type TResult =
        | number
        | {
              [betChoice: string]: any;
          };

    export type TSettlementResult = {
        [betChoice: string]: boolean;
    };

    export class Winners {
        roundId: number;
        winningPlayers: TWinningPlayers;

        static eventName = "winners";
    }

    export type TWinningPlayers = {
        [playerId: number]: {
            bet: number;
            rate: number;
            win: boolean;
            winningByChoices: GameServiceMessage.Odds;
        };
    };

    export const spb = "spb";
    export const snr = "snr";
    export const epb = "epb";

    export class DisabledGameInfo {
        "vi-VN": string;
        "en-US": string;
        "zh-CN": string;
        "zh-TW": string;
        "th-TH": string;
        "id-ID": string;

        static eventName = "um_message";
    }

    export class BetHistory {
        static eventName = "history";
    }

    export class AccountClosed {
        errorCode: string;
        isDisabledAccount: boolean;

        static eventName = "kickedOut";
    }
    export class ReBet {
        [betChoice: string]: {
            [chipValue: string]: number;
        };

        static eventName = "rebet";
    }

    export class CrashGameConfigs {
        maxMultiplier: number;

        static eventName = "gameConfigs";
    }

    export class RoundPFResult extends ProvablyFair {
        static eventName = "roundPFResult";
    }

    export class CutCard {
        cutCardIndex: number;
        successful: boolean;
        static eventName = "cutCard";
    }

    export class NewShoeHash {
        hashValue: string;
        static eventName = "newShoeHash";
    }

    export class ShoeInfo {
        roundTime: number;
        cutCardIndex?: number;
        burnedCards: number;
        firstCard: Card;
        currentIndex: number;

        animated?: boolean;
        hashValue?: string;
        newShoePhase?: boolean;
        new?: boolean;
        static eventName = "shoeInfo";
    }

    export class Card {
        rank: number;
        suit: number;
    }

    export class BaccaratCardMultiplier {
        rank: number;
        suit: number;
        value: number;
    }

    export class BaccaratMultiplierCards {
        static eventName = "multiplierCards";
    }

    export class FinalOdds {
        [betChoice: string]: number;
        static eventName = "finalOdds";
    }

    export const OddsMultipliers = "oddsMultipliers";
    export class ShoeVerification {
        roundId: number;
        hashValue: string;
        rawValue: string;
        cutCardPF: CutCardPF;
        cutCardIndex: number;
        cards: Card[];
        usedCardIndexes: number[];
        burnedCards: number;
        static eventName = "shoeVerification";
    }

    export class BetDetails {
        static eventName = "betDetailsUrl";
    }

    export class BaccaratXGameConfigs {
        extraFeeRatio: number;

        static eventName = "gameConfigs";
    }
}

export namespace NotificationServiceMessage {
    class UMInfo {
        isUM: boolean;
        operatorId: string;
        startTime: Date;
        endTime: Date;
    }

    export class UnderMaintenanceInfo {
        message: string;
        umInfo: UMInfo;
        static eventName = "notifyKickedOut";
    }

    export const sessionTimeoutEventName = "notifyTimeout";

    export const reloadEventName = "reload";

    export class JackpotWinner {
        gameId: number;
        winnerName: string;
        amount: number;
        pool: number;
        static eventName = "jackpotWinner";
    }

    export class PromotionNotifications {
        promotions: Array<PromotionModel>;
        static eventName = "promotionNotifications";
    }

    export class BoostedOdd {
        promotions: Array<BoostedOddsModel>;
        static eventName = "promotions";
    }
}
