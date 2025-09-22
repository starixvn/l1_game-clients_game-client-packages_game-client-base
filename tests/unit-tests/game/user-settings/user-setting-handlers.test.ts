import { stub } from "jest-auto-stub";
import { AudioType } from "../../../../src/game/audios";
import { UserSettingHandlers } from "../../../../src/game/user-settings/user-setting-handlers";
import { UserSettingStore } from "../../../../src/game/user-settings/user-setting-store";
import { StorageManager, localStorageKeys, BrowserDomUtils } from "../../../../src/shared/utils";

describe("UserSettingHandlers", () => {
    let userSettingHandlers: UserSettingHandlers;
    let userSettingStore: UserSettingStore;

    beforeAll(() => {
        userSettingStore = new UserSettingStore();
        userSettingHandlers = new UserSettingHandlers(userSettingStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("loadStorages", () => {
        it("should load storages successfully", () => {
            // Arrange
            const settingsData = {
                musicEnable: true,
                sfxEnable: false,
            };
            StorageManager.get = jest.fn().mockReturnValue(settingsData);

            // Act
            userSettingHandlers.loadStorages();

            // Assert
            expect(StorageManager.get).toHaveBeenCalledWith(localStorageKeys.playerSetting);
            expect(userSettingStore.musicEnable).toBe(settingsData.musicEnable);
            expect(userSettingStore.sfxEnable).toBe(settingsData.sfxEnable);
        });

        it("should not load storages if there are no settings available", () => {
            // Arrange
            const defaultStore = stub<UserSettingStore>({ musicEnable: false, sfxEnable: true });
            userSettingStore = defaultStore;
            StorageManager.get = jest.fn().mockReturnValue(undefined);

            // Act
            userSettingHandlers.loadStorages();

            // Assert
            expect(userSettingStore.musicEnable).toEqual(defaultStore.musicEnable);
            expect(userSettingStore.sfxEnable).toEqual(defaultStore.sfxEnable);
        });
    });

    describe("saveStorages", () => {
        it("should save storages successfully", () => {
            // Arrange
            const settingsData = {
                musicEnable: true,
                sfxEnable: false,
                bgmVolume: 1,
                sfxVolume: 1,
            };

            userSettingStore = stub<UserSettingStore>(settingsData);
            StorageManager.set = jest.fn();

            // Act
            userSettingHandlers.saveStorages();

            // Assert
            expect(StorageManager.set).toHaveBeenCalledWith(localStorageKeys.playerSetting, userSettingStore);
        });
    });

    describe("setMusicEnable", () => {
        it("should set music enable successfully", () => {
            // Arrange
            const saveStoragesMock = jest.spyOn(userSettingHandlers, "saveStorages");

            // Act
            userSettingHandlers.setMusicEnable(true);

            // Assert
            expect(userSettingStore.musicEnable).toEqual(true);
            expect(saveStoragesMock).toHaveBeenCalled();
        });
    });

    describe("setSfxEnable", () => {
        it("should set sfx enable successfully", () => {
            // Arrange
            const saveStoragesMock = jest.spyOn(userSettingHandlers, "saveStorages");

            // Act
            userSettingHandlers.setSfxEnable(false);

            // Assert
            expect(userSettingStore.sfxEnable).toEqual(false);
            expect(saveStoragesMock).toHaveBeenCalled();
        });
    });

    describe("handleAudioChanged", () => {
        describe("when change music", () => {
            let setMusicEnableMock: jest.SpyInstance;
            beforeEach(() => {
                setMusicEnableMock = jest.spyOn(userSettingHandlers, "setMusicEnable");
                BrowserDomUtils.postMessageToParent = jest.fn();
            });
            it("should handle audio change for music type", () => {
                // Act
                userSettingHandlers.handleAudioChanged(AudioType.MUSIC, true);

                // Assert
                expect(setMusicEnableMock).toHaveBeenCalledWith(true);
            });

            it("should BrowserDomUtils.postMessageToParent", () => {
                // Act
                userSettingHandlers.handleAudioChanged(AudioType.MUSIC, true);

                // Assert
                expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ musicEnable: true });
            });
        });

        describe("when change sfx", () => {
            let setSfxEnableMock: jest.SpyInstance;
            beforeEach(() => {
                setSfxEnableMock = jest.spyOn(userSettingHandlers, "setSfxEnable");
            });
            it("should handle audio change for sfx type", () => {
                // Act
                userSettingHandlers.handleAudioChanged(AudioType.SFX, true);

                // Assert
                expect(setSfxEnableMock).toHaveBeenCalledWith(true);
            });

            it("should BrowserDomUtils.postMessageToParent", () => {
                // Act
                userSettingHandlers.handleAudioChanged(AudioType.SFX, true);

                // Assert
                expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ sfxEnable: true });
            });
        });
    });
});
