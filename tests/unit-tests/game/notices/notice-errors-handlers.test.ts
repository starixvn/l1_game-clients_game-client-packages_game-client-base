import { stub } from "jest-auto-stub";
import { AppHandlers, AppStore } from "../../../../src/app";
import { AuthHandlers, AuthStore } from "../../../../src/auth";
import { ConnectionStore } from "../../../../src/game/connection/connection-store";
import { GameSetting } from "../../../../src/game/game-configs/game-setting";
import { NoticeErrorsHandlers } from "../../../../src/game/notices/notice-errors-handlers";
import { NoticeInfo, NoticeStore, NoticeType } from "../../../../src/game/notices/notice-store";
import { ErrorUtils } from "../../../../src/shared/utils";
import { Translator } from "../../../../src/shared/utils/localization-manager";
import { AppTypes } from "./../../../../src/shared/constants/app-type";

jest.mock("../../../../src/shared/utils", () => ({
    ErrorUtils: { isSessionTimeoutError: jest.fn().mockReturnValue(false), parseErrorCode: jest.fn().mockReturnValue("") },
}));
jest.mock("../../../../src/shared/utils/localization-manager", () => ({
    Translator: {
        translate: jest.fn(),
        gameTranslate: jest.fn(),
        commonTranslate: jest.fn().mockImplementation((key, option) => key),
        getMessageFollowSystem: jest.fn().mockImplementation((system, key, option) => key),
    },
}));
jest.mock("mobx");

describe("NoticeErrorsHandlers", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe("AutoSignOut", () => {
        let handler: NoticeErrorsHandlers.AutoSignOutHandler;
        let appStore: AppStore;
        let noticeStore: NoticeStore;
        let authStore: AuthStore;
        let signOutHandler: AuthHandlers.SignOut;
        let connectionStore: ConnectionStore;
        let clearRecheckInInterval: AuthHandlers.ClearRecheckInInterval;
        beforeAll(() => {
            appStore = stub<AppStore>();
            noticeStore = stub<NoticeStore>();
            authStore = stub<AuthStore>();
            signOutHandler = stub<AuthHandlers.SignOut>();
            connectionStore = stub<ConnectionStore>();
            clearRecheckInInterval = stub<AuthHandlers.ClearRecheckInInterval>();
        });

        beforeEach(() => {
            handler = new NoticeErrorsHandlers.AutoSignOutHandler(
                appStore,
                noticeStore,
                authStore,
                signOutHandler,
                connectionStore,
                clearRecheckInInterval
            );
        });

        describe("onErrorCodeChange", () => {
            beforeEach(() => {
                handler.showErrorNoticeAndSignOut = jest.fn();
            });
            it("should call handle with account closed when isDisabledAccount true", () => {
                // arrange
                authStore.isDisabledAccount = true;
                (Translator.getMessageFollowSystem as jest.Mock).mockReturnValueOnce("accountClosed");

                // act
                handler.onErrorCodeChange("");

                // assert
                expect(handler.showErrorNoticeAndSignOut).toHaveBeenCalledWith("accountClosed", NoticeInfo.DisabledAccount);
            });

            describe("when error code is session timeout error", () => {
                beforeEach(() => {
                    authStore.isDisabledAccount = false;
                    (ErrorUtils.isSessionTimeoutError as jest.Mock).mockReturnValueOnce(true);
                });
                it("should call handle with sessionExpired message when app", () => {
                    // arrange
                    appStore.isApp = true;
                    (Translator.getMessageFollowSystem as jest.Mock).mockReturnValueOnce("message_session_expired");

                    // act
                    handler.onErrorCodeChange("123");

                    // assert

                    expect(handler.showErrorNoticeAndSignOut).toHaveBeenCalledWith(
                        `message_session_expired (123)`,
                        NoticeInfo.SessionTimeout
                    );
                });

                it("should call handle with sessionTimeout message when not app", () => {
                    // arrange
                    appStore.isApp = false;
                    (Translator.getMessageFollowSystem as jest.Mock).mockReturnValueOnce("message_session_timeout");

                    // act
                    handler.onErrorCodeChange("123");

                    // assert
                    expect(handler.showErrorNoticeAndSignOut).toHaveBeenCalledWith(
                        `message_session_timeout (123)`,
                        NoticeInfo.SessionTimeout
                    );
                });
            });

            describe("when error code is not session timeout error", () => {
                beforeEach(() => {
                    authStore.isDisabledAccount = false;
                    (ErrorUtils.isSessionTimeoutError as jest.Mock).mockReturnValueOnce(false);
                });
                it("should addNotice", () => {
                    // arrange
                    (ErrorUtils.parseErrorCode as jest.Mock).mockReturnValueOnce("key");
                    (Translator.translate as jest.Mock).mockReturnValueOnce("message");
                    (Translator.commonTranslate as jest.Mock).mockReturnValueOnce("notice");
                    const errorCode = "2005";

                    // act
                    handler.onErrorCodeChange(errorCode);

                    // assert
                    expect(Translator.translate).toHaveBeenCalledWith("key", { errorCode });
                    expect(noticeStore.addNotice).toHaveBeenCalledWith({
                        message: "message",
                        title: "notice",
                        type: NoticeType.Error,
                        onClose: null,
                        showBtnConfirmButton: true,
                        noticeInfo: NoticeInfo.ApiError,
                    });
                });
            });
        });

        describe("showErrorNoticeAndSignOut", () => {
            beforeEach(() => {
                jest.useFakeTimers();
                jest.spyOn(global, "setTimeout");
            });

            afterEach(() => {
                jest.runOnlyPendingTimers();
                jest.useRealTimers();
            });

            it("should call sign out handler after 10s", () => {
                // act
                handler.showErrorNoticeAndSignOut();
                jest.advanceTimersByTime(10000);

                // assert
                expect(signOutHandler.handle).toHaveBeenCalled();
                expect(connectionStore.closeSocket).toHaveBeenCalled();
                expect(clearRecheckInInterval.handle).toHaveBeenCalled();
            });

            it("should add expected notice into noticeStore ", () => {
                // arrange
                (Translator.commonTranslate as jest.Mock).mockReturnValueOnce("Notice");

                // act
                handler.showErrorNoticeAndSignOut("message");

                // assert
                expect((noticeStore.addNotice as jest.Mock).mock.calls[0][0].message).toBe("message");
                expect((noticeStore.addNotice as jest.Mock).mock.calls[0][0].title).toBe("Notice");
                expect((noticeStore.addNotice as jest.Mock).mock.calls[0][0].type).toBe(NoticeType.Error);
                expect(typeof (noticeStore.addNotice as jest.Mock).mock.calls[0][0].onClose).toBe("function");
            });
        });
    });

    describe("BackToOperatorLobby", () => {
        let handler: NoticeErrorsHandlers.BackToOperatorLobbyHandler;
        let gameSetting: GameSetting;
        let connectionStore: ConnectionStore;
        let noticeStore: NoticeStore;
        let backToOperatorLobbyHandler: AppHandlers.BackToOperatorLobby;
        let authStore: AuthStore;
        beforeAll(() => {
            gameSetting = stub<GameSetting>();
            noticeStore = stub<NoticeStore>();
            connectionStore = stub<ConnectionStore>();
            backToOperatorLobbyHandler = stub<AppHandlers.BackToOperatorLobby>();
            authStore = stub<AuthStore>({ system: AppTypes.App });
        });

        beforeEach(() => {
            handler = new NoticeErrorsHandlers.BackToOperatorLobbyHandler(
                gameSetting,
                connectionStore,
                noticeStore,
                backToOperatorLobbyHandler,
                authStore
            );
            (Translator.gameTranslate as jest.Mock).mockReturnValueOnce("Game name");
            (Translator.getMessageFollowSystem as jest.Mock).mockReturnValueOnce("lost game connection");
            (Translator.commonTranslate as jest.Mock).mockReturnValueOnce("Notice");
        });

        it("should add notice when connection is lost", () => {
            // act
            handler.showNotice();
            console.log((noticeStore.addNotice as jest.Mock).mock.calls);
            console.log((noticeStore.addNotice as jest.Mock).mock.calls[0][0].message);

            // assert
            expect((noticeStore.addNotice as jest.Mock).mock.calls[0][0].message).toBe("lost game connection");
            expect((noticeStore.addNotice as jest.Mock).mock.calls[0][0].title).toBe("Notice");
            expect((noticeStore.addNotice as jest.Mock).mock.calls[0][0].type).toBe(NoticeType.Error);
            expect(typeof (noticeStore.addNotice as jest.Mock).mock.calls[0][0].onClose).toBe("function");
            expect(Translator.gameTranslate).toHaveBeenCalledWith(`game_name`);
            expect(Translator.getMessageFollowSystem).toHaveBeenCalledWith(AppTypes.App, "message_lost_game_connection", {
                gameName: "Game name",
            });
            expect(Translator.commonTranslate).toHaveBeenCalledWith("notice");
        });

        it("should call backToOperatorLobbyHandler when isDisconnect", () => {
            // arrange
            connectionStore.isDisconnect = true;

            // act
            handler.handleDisConnect();

            // assert
            expect(backToOperatorLobbyHandler.handle).toHaveBeenCalled();
        });
    });

    describe("DirectNotice", () => {
        let handler: NoticeErrorsHandlers.BackToOperatorLobbyHandler;
        let gameSetting: GameSetting;
        let connectionStore: ConnectionStore;
        let noticeStore: NoticeStore;
        let backToOperatorLobbyHandler: AppHandlers.BackToOperatorLobby;
        let authStore: AuthStore;
        beforeAll(() => {
            gameSetting = stub<GameSetting>();
            noticeStore = stub<NoticeStore>();
            connectionStore = stub<ConnectionStore>();
            backToOperatorLobbyHandler = stub<AppHandlers.BackToOperatorLobby>();
            authStore = stub<AuthStore>({ system: AppTypes.MobileDirect });
        });

        beforeEach(() => {
            handler = new NoticeErrorsHandlers.BackToOperatorLobbyHandler(
                gameSetting,
                connectionStore,
                noticeStore,
                backToOperatorLobbyHandler,
                authStore
            );
            (Translator.gameTranslate as jest.Mock).mockReturnValueOnce("Game name");
            (Translator.getMessageFollowSystem as jest.Mock).mockReturnValueOnce("lost game connection");
            (Translator.commonTranslate as jest.Mock).mockReturnValueOnce("Notice");
        });

        it("should add notice when showing mobile direct notice", () => {
            // act
            handler.showReconnectNotice();

            // assert
            expect(noticeStore.addNotice).toHaveBeenCalledWith({
                message: "lost game connection",
                title: "Notice",
                type: NoticeType.Error,
                onClose: expect.any(Function),
                noticeInfo: NoticeInfo.LostGameConnection,
                showBtnConfirmButton: true,
            });
            expect(Translator.getMessageFollowSystem).toHaveBeenCalledWith(AppTypes.MobileDirect, "message_lost_game_connection", {
                gameName: "Game name",
            });
            expect(Translator.commonTranslate).toHaveBeenCalledWith("notice");
        });
    });
});
