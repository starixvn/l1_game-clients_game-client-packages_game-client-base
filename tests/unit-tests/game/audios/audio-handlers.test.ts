import lodash from "lodash";
import { AudioAction, AudioHandler, AudioStore, MusicState } from "./../../../../src/game/audios";
import { UserSettingStore } from "./../../../../src/game/user-settings";
jest.unmock("lodash");
describe("AudioHandler", () => {
    let audioStore: AudioStore;
    let userSettingsStore: UserSettingStore;
    let audioHandler: AudioHandler;

    const audioId = "audio-id";

    beforeAll(() => {
        audioStore = new AudioStore();
        userSettingsStore = new UserSettingStore();
        audioHandler = new AudioHandler(audioStore, userSettingsStore);
    });

    describe("playMusic", () => {
        it("should set music action to play if musicEnable is true", () => {
            // Arrange
            userSettingsStore.musicEnable = true;

            // Act
            audioHandler.playMusic(audioId);

            // Assert
            expect(audioStore.music).toEqual({ id: audioId, action: AudioAction.PLAY, loop: false });
        });
        it("should not set music action to play if musicEnable is false", () => {
            // Arrange
            const lastMusic = audioStore.music;
            userSettingsStore.musicEnable = false;

            // Act
            audioHandler.playMusic(audioId);

            // Assert
            expect(audioStore.music).toBe(lastMusic);
        });
    });

    describe("stopMusic", () => {
        it("should set music action to stop", () => {
            // Arrange

            // Act
            audioHandler.stopMusic(audioId);

            // Assert
            expect(audioStore.music).toEqual({ id: audioId, action: AudioAction.STOP });
        });
    });

    describe("playSFX", () => {
        it("should set sfx with PLAY action if sfxEnable in user settings store is true", () => {
            // Arrange
            userSettingsStore.sfxEnable = true;

            // Act
            audioHandler.playSFX(audioId);

            // Assert
            expect(audioStore.sfx).toEqual({ id: audioId, action: AudioAction.PLAY });
        });

        it("should not set sfx if sfxEnable in user settings store is false", () => {
            // Arrange
            const lastSfx = audioStore.sfx;
            userSettingsStore.sfxEnable = false;

            // Act
            audioHandler.playSFX(audioId);

            // Assert
            expect(audioStore.sfx).toBe(lastSfx);
        });
    });

    describe("stopSFX", () => {
        it("should set sfx with STOP action", () => {
            // Arrange
            audioStore.sfx = { id: "other", action: AudioAction.PLAY };

            // Act
            audioHandler.stopSFX(audioId);

            // Assert
            expect(audioStore.sfx).toEqual({ id: audioId, action: AudioAction.STOP });
        });
    });

    describe("updateMusicState", () => {
        it("should set musicState to the given value", () => {
            // Arrange
            audioStore.musicState = MusicState.NONE;

            // Act
            audioHandler.updateMusicState(MusicState.STARTED);

            // Assert
            expect(audioStore.musicState).toBe(MusicState.STARTED);
        });
    });

    describe("setMusicIds", () => {
        it("should set musicIds to the given array of ids", () => {
            // Act
            audioHandler.setMusicIds(["id1", "id2"]);

            // Assert
            expect(audioStore.musicIds).toEqual(["id1", "id2"]);
        });
    });

    describe("audiosLoaded", () => {
        it("should set startMusicPlayer by setting music enable", () => {
            // Act
            audioHandler.audiosLoaded();

            // Assert
            expect(audioStore.startMusicPlayer).toEqual(userSettingsStore.musicEnable);
        });
    });

    describe("playRandomMusic", () => {
        beforeEach(() => {
            audioHandler.playMusic = jest.fn();
        });

        it("should do nothing if musicIds array is empty", () => {
            // Arrange
            audioStore.musicIds = [];

            // Act
            audioHandler.playRandomMusic();

            // Assert
            expect(audioHandler.playMusic).not.toHaveBeenCalled();
        });

        it("should call playMusic with the only available music id", () => {
            // Arrange
            audioStore.musicIds = ["id1"];

            // Act
            audioHandler.playRandomMusic();

            // Assert
            expect(audioHandler.playMusic).toHaveBeenCalledWith("id1");
        });

        it("should call playMusic with a random music id", () => {
            // Arrange
            audioStore.musicIds = ["id1", "id2"];
            lodash.sample = jest.fn(() => "id2");

            // Act
            audioHandler.playRandomMusic();

            // Assert
            expect(audioHandler.playMusic).toHaveBeenCalledWith("id2");
        });

        it("should call  random with correct param", () => {
            // Arrange
            audioStore.musicIds = ["id1", "id2", "id3", "id4"];
            lodash.sample = jest.fn();

            // Act
            audioHandler.playRandomMusic();

            // Assert
            expect(lodash.sample).toHaveBeenCalledWith(audioStore.musicIds);
        });
    });
});
