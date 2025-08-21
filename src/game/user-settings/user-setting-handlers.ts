import { inject, injectable } from "inversify";
import { BrowserDomUtils, StorageManager, localStorageKeys } from "../../shared/utils";
import { AnalyticsManager, PFObjectName, TrackingAction, TrackingEvent } from "../../shared/utils/analytics-manager";
import { AudioType } from "../audios/audio-store";
import { GameSetting } from "../game-configs";
import { UserSettingData, UserSettingStore } from "./user-setting-store";

@injectable()
export class UserSettingHandlers {
    constructor(@inject(UserSettingStore) private readonly userSettingStore: UserSettingStore) {}

    loadStorages() {
        const settings = StorageManager.get(localStorageKeys.playerSetting);
        if (!settings) {
            return;
        }
        const keys = Object.keys(settings);
        keys?.forEach((key) => {
            try {
                this.userSettingStore[key] = settings[key];
            } catch (err) {
                console.log("User settings: storage key not map with settings store ", key);
            }
        });
    }

    saveStorages() {
        const data: UserSettingData = { musicEnable: this.userSettingStore.musicEnable, sfxEnable: this.userSettingStore.sfxEnable };
        StorageManager.set(localStorageKeys.playerSetting, data);
    }

    handleAudioChanged(type: AudioType, enable: boolean) {
        if (type === AudioType.MUSIC) {
            this.setMusicEnable(enable);
            BrowserDomUtils.postMessageToParent({ musicEnable: enable });
        } else if (type === AudioType.SFX) {
            this.setSfxEnable(enable);
            BrowserDomUtils.postMessageToParent({ sfxEnable: enable });
        }

        const objectName = this.getObjectName(type);
        AnalyticsManager.trackEvent(TrackingEvent.Button, {
            location: GameSetting?.name || "",
            action: enable ? TrackingAction.ToggleOn : TrackingAction.ToggleOff,
            object_name: objectName,
        });
    }

    setMusicEnable(enable: boolean) {
        this.userSettingStore.musicEnable = enable;
        this.saveStorages();
    }

    setSfxEnable(enable: boolean) {
        this.userSettingStore.sfxEnable = enable;
        this.saveStorages();
    }

    private getObjectName(type: number): string {
        const dict = [PFObjectName.MusicEnabled, PFObjectName.SfxEnabled];
        return dict[type];
    }
}
