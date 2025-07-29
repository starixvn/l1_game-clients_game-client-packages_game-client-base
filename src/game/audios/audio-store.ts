import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
export enum AudioType {
    MUSIC = 0,
    SFX,
}

export enum AudioAction {
    STOP = 0,
    PLAY,
}

export enum MusicState {
    NONE = -1,
    STARTED = 0,
    ENDED,
}

export interface AudioData {
    id: string;
    action: AudioAction;
    loop?: boolean;
}

@injectable()
export class AudioStore {
    constructor() {
        makeAutoObservable(this, {
            musicIds: false,
        });
    }

    musicIds: string[] = [];
    musicGameIds: string[] = [];
    private _musicState: number = MusicState.NONE;

    public get musicState(): number {
        return this._musicState;
    }

    public set musicState(value: number) {
        this._musicState = value;
    }

    private _music: AudioData = null;

    public get music(): AudioData {
        return this._music;
    }

    public set music(value: AudioData) {
        this._music = value;
    }

    private _sfx: AudioData = null;

    public get sfx(): AudioData {
        return this._sfx;
    }

    public set sfx(value: AudioData) {
        this._sfx = value;
    }

    private _startMusicPlayer = false;

    get startMusicPlayer() {
        return this._startMusicPlayer;
    }

    set startMusicPlayer(value: boolean) {
        this._startMusicPlayer = value;
    }

    private _stoppableSFX: AudioData = null;
    get stoppableSFX(): AudioData {
        return this._stoppableSFX;
    }
    set stoppableSFX(value: AudioData) {
        this._stoppableSFX = value;
    }
}
