import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { Hand, PlayerHand, PusoyServiceMessages } from "../pusoy-service-messages";

export type HandData = {
    hand: Hand<number[]>;
    suitConfig: { [key: string]: string };
    scoreConfig: any;
};

@injectable()
export class RoundStore {
    private _suitesMapper: { [key: string]: string } = {};
    private _scoreConfig: any = {};
    private _roundId = 0;
    public get roundId() {
        return this._roundId;
    }
    public set roundId(value) {
        this._roundId = value;
    }

    private _otherPlayers: PusoyServiceMessages.OtherPlayer[] = [];
    public get otherPlayers(): PusoyServiceMessages.OtherPlayer[] {
        return this._otherPlayers;
    }
    public set otherPlayers(value: PusoyServiceMessages.OtherPlayer[]) {
        this._otherPlayers = value;
    }
    private _submittedPlayers: PusoyServiceMessages.SubmittedPlayer[] = [];
    public get submittedPlayers(): PusoyServiceMessages.SubmittedPlayer[] {
        return this._submittedPlayers;
    }
    public set submittedPlayers(value: PusoyServiceMessages.SubmittedPlayer[]) {
        this._submittedPlayers = value;
    }

    initPlayerHand: PlayerHand = {
        hand: {
            front: [],
            middle: [],
            back: [],
        },
        playerId: undefined,
        slot: undefined,
    };

    constructor() {
        makeAutoObservable(this);
    }

    get hand(): HandData {
        return {
            hand: this.initPlayerHand?.hand,
            suitConfig: this._suitesMapper,
            scoreConfig: this._scoreConfig,
        };
    }

    get suitesMapper(): { [key: string]: string } {
        return this._suitesMapper;
    }

    setSuitesMapper(suitesMapper: { [key: string]: string }) {
        this._suitesMapper = suitesMapper;
    }
}
