import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";
import { ChipInfo } from "sc-user-service-client/dist/setting";

export type TGameConfiguration = {
    id: number;
    name: string;
    key: string;
    mini?: {
        miniPanel: boolean;
    };
    route?: string;
    remoteBundle?: {
        dependsOn: string[];
    };
    isMicrosite?: boolean;
    hasInstant?: boolean;
    gateway?: {
        id: number;
    };
    bannerType?: string;
};

@injectable()
export class GameConfigurationStore {
    constructor() {
        makeAutoObservable(this);
    }

    private _gameConfiguration: TGameConfiguration[] = [];

    get gameConfiguration() {
        return this._gameConfiguration;
    }

    setGameConfiguration(configurations: TGameConfiguration[]) {
        this._gameConfiguration = configurations;
    }
}
