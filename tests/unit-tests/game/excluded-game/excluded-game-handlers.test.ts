import { stub } from "jest-auto-stub";
import { AppHandlers } from "../../../../src/app/app-handlers";
import { AuthStore } from "../../../../src/auth/auth-store";
import { NoPermissionHandlers } from "../../../../src/game/excluded-game";
import { NoticeStore } from "../../../../src/game/notices";
import { GameServiceMessage } from "../../../../src/shared";
import { gameSettings } from "../../container.test";
import { AppTypes } from "./../../../../src/shared/constants/app-type";
jest.mock("../../../../src/shared/utils/localization-manager", () => {
    return {
        Translator: {
            translate: jest.fn(),
            gameTranslate: jest.fn(),
            commonTranslate: jest.fn().mockImplementation((key, option) => key),
            getMessageFollowSystem: jest.fn().mockImplementation((system, key, option) => key),
        },
    };
});

describe("ExcludedGameHandlers tests", () => {
    let noticeStore: NoticeStore, backToOperatorLobby: AppHandlers.BackToOperatorLobby, handler: NoPermissionHandlers, authStore: AuthStore;

    it("has name is equal notpermitted", () => {
        // arrange
        noticeStore = stub<NoticeStore>();
        authStore = stub<AuthStore>();
        backToOperatorLobby = stub<AppHandlers.BackToOperatorLobby>();

        handler = new NoPermissionHandlers(noticeStore, gameSettings, backToOperatorLobby, authStore);

        // assert
        expect(handler.name).toEqual(GameServiceMessage.notPermittedToPlay);
    });

    describe("handle", () => {
        test("should add notice", () => {
            // arrange
            noticeStore = stub<NoticeStore>();
            authStore = stub<AuthStore>();
            authStore.system = AppTypes.Club;
            backToOperatorLobby = stub<AppHandlers.BackToOperatorLobby>();
            backToOperatorLobby.handle = jest.fn();

            handler = new NoPermissionHandlers(noticeStore, gameSettings, backToOperatorLobby, authStore);

            let calledArgs;
            jest.spyOn(noticeStore, "addNotice").mockImplementation((args) => (calledArgs = args));

            // act
            handler.handle();

            // assert
            expect(calledArgs.message).toBe("game_excluded");
            expect(calledArgs.title).toBe("notice");
            expect(calledArgs.type).toBe(0);
            calledArgs.onClose();
            expect(backToOperatorLobby.handle).toBeCalled();
        });
    });
});
