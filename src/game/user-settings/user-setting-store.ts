import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

export interface UserSettingData {
    musicEnable: boolean;
    sfxEnable: boolean;
    bgmVolume: number;
    sfxVolume: number;
}

@injectable()
export class UserSettingStore implements UserSettingData {
    constructor() {
        makeAutoObservable(this);
    }

    private _musicEnable = true;
    public get musicEnable() {
        return this._musicEnable;
    }
    public set musicEnable(value) {
        this._musicEnable = value;
    }
    private _sfxEnable = true;
    public get sfxEnable() {
        return this._sfxEnable;
    }
    public set sfxEnable(value) {
        this._sfxEnable = value;
    }

    private _sfxVolume: number = 1;
    public get sfxVolume(): number {
        return this._sfxVolume;
    }

    public set sfxVolume(value: number) {
        this._sfxVolume = value;
    }

    private _bgmVolume: number = 1;
    public get bgmVolume(): number {
        return this._bgmVolume;
    }

    public set bgmVolume(value: number) {
        this._bgmVolume = value;
    }
}
