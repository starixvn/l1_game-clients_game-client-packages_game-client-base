import { stub } from "jest-auto-stub";
import { AppHandlers } from "../../../../src/app";
import { AuthStore } from "../../../../src/auth/auth-store";
import { ConnectionStore } from "../../../../src/game/connection";
import { DisableGameHandlers, DisabledGameStore } from "../../../../src/game/disabled-game";
import { NoticeStore } from "../../../../src/game/notices";
import { RoundRunningHandlers } from "../../../../src/game/rounds";
import { RoundTimeStore } from "../../../../src/game/rounds/round-time-store";
import { SettlementStore } from "../../../../src/game/settlements";
import { GameServiceMessage } from "../../../../src/shared";
import { AppTypes } from "./../../../../src/shared/constants/app-type";

jest.mock("../../../../src/shared/utils/localization-manager", () => {
    return {
        Translator: {
            translate: jest.fn(),
            gameTranslate: jest.fn(),
            commonTranslate: jest.fn().mockImplementation((key, option) => key),
        },
    };
});

describe("DisableGameHandlers tests", () => {
    const fakeDisabledGameInfo: GameServiceMessage.DisabledGameInfo = {
        "vi-VN": "Fake disabled game message VN",
        "en-US": "Fake disabled game message",
        "zh-CN": "Fake disabled game message CN",
        "zh-TW": "Fake disabled game message TW",
        "th-TH": "Fake disabled game message TH",
        "id-ID": "Fake disabled game message ID",
    };

    let connectionStore: ConnectionStore,
        authStore: AuthStore,
        disabledGameStore: DisabledGameStore,
        noticeStore: NoticeStore,
        roundTimeStore: RoundTimeStore,
        backToOperatorLobby: AppHandlers.BackToOperatorLobby,
        handler: DisableGameHandlers,
        roundRunningHandlers: RoundRunningHandlers,
        settlementStore: SettlementStore;

    beforeAll(() => {
        // arrange
        connectionStore = stub<ConnectionStore>();
        authStore = stub<AuthStore>();
        disabledGameStore = stub<DisabledGameStore>();
        disabledGameStore.setGameStatus = jest.fn();
        disabledGameStore.setShowPopup = jest.fn();

        noticeStore = stub<NoticeStore>();
        noticeStore.addNotice = jest.fn();

        settlementStore = stub<SettlementStore>();

        roundTimeStore = stub<RoundTimeStore>();
        roundTimeStore.resetRoundTime = jest.fn();
        roundTimeStore.startNewRound = true;

        roundRunningHandlers = stub<RoundRunningHandlers>();

        backToOperatorLobby = stub<AppHandlers.BackToOperatorLobby>();

        handler = new DisableGameHandlers(
            connectionStore,
            authStore,
            roundTimeStore,
            disabledGameStore,
            noticeStore,
            backToOperatorLobby,
            roundRunningHandlers,
            settlementStore
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
    });

    describe("onClosedHandle", () => {
        beforeEach(() => {
            connectionStore.onDisconnected = jest.fn();
            backToOperatorLobby.handle = jest.fn();
        });
        describe("when already disable game", () => {
            it("should disconnect socket and back to lobby", () => {
                // act
                handler.onClosedHandle();

                // assert
                expect(connectionStore.onDisconnected).toBeCalledTimes(1);
                expect(backToOperatorLobby.handle).toBeCalledTimes(1);
            });
        });

        it("should not call onDisconnected and handle when instant app", () => {
            // arrange
            authStore.system = AppTypes.Instant;

            // act
            handler.onClosedHandle();

            // assert
            expect(connectionStore.onDisconnected).not.toHaveBeenCalled();
            expect(backToOperatorLobby.handle).not.toHaveBeenCalled();
        });
    });

    describe("showPopupHandle", () => {
        const authStoreLangs = [
            ["vi-VN", fakeDisabledGameInfo["vi-VN"]],
            ["en-US", fakeDisabledGameInfo["en-US"]],
            ["zh-CN", fakeDisabledGameInfo["zh-CN"]],
            ["zh-TW", fakeDisabledGameInfo["zh-TW"]],
            ["th-TH", fakeDisabledGameInfo["th-TH"]],
            ["id-ID", fakeDisabledGameInfo["id-ID"]],
        ];
        test.each(authStoreLangs)("should set disable game true and open popup.", (authStoreLang, expectedDisabledMessages) => {
            // arrange
            disabledGameStore.disabled = true;
            authStore.language = authStoreLang;

            // act
            handler.showPopupHandle();

            // assert
            expect(disabledGameStore.setNoticeDisable).toBeCalled();
        });
    });

    describe("inGameHandle", () => {
        describe("when game is already disabled ", () => {
            it("should show popup and clear round running", () => {
                // arrange
                // @ts-ignore
                roundTimeStore.isShowDisabledGameMessage = jest.fn().mockReturnValue(true);
                // @ts-ignore
                settlementStore.currentFinish = null;

                handler.showPopupHandle = jest.fn();
                roundRunningHandlers.stopRunner = jest.fn();
                jest.useFakeTimers();

                // act
                handler.inGameHandle();

                // assert
                jest.advanceTimersByTime(0);
                expect(handler.showPopupHandle).toBeCalled();
                expect(roundRunningHandlers.stopRunner).toBeCalled();
            });

            it("should not show popup and not touch to round running", () => {
                // arrange
                // @ts-ignore
                roundTimeStore.isShowDisabledGameMessage = jest.fn().mockReturnValue(false);
                // @ts-ignore
                settlementStore.currentFinish = true;

                handler.showPopupHandle = jest.fn();
                roundRunningHandlers.stopRunner = jest.fn();

                // act
                handler.inGameHandle();

                // assert
                expect(handler.showPopupHandle).not.toBeCalled();
                expect(roundRunningHandlers.stopRunner).not.toBeCalled();
            });
        });
    });
});
