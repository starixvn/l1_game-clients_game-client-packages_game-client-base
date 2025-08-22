import { InterpolationOptions, TranslationManager, TranslationOptions } from "./../../../../src/shared/utils/localization-manager";
// Mocking TolgeeInstance
class MockTolgeeInstance {
    public run = jest.fn();
    public on = jest.fn();
    public t = jest.fn((key: string) => `Tolgee Translation: ${key}`);
    public changeLanguage = jest.fn();
}

describe("TranslationManager", () => {
    let translationManager: TranslationManager;
    let mockTolgeeInstance: MockTolgeeInstance;

    beforeEach(() => {
        mockTolgeeInstance = new MockTolgeeInstance();
        const options: TranslationOptions = {
            languageId: "en",
            isUseTolgeeRealTime: false,
            tolgeeUrl: "",
            onLoaded: jest.fn(),
            availableLanguages: ["en", "vi"],
            gameNamespaces: ["GameNamespace"],
            getStaticData: (languageId: string) => {
                if (languageId == "vi") {
                    return {
                        translation: {
                            key: "Static Data Translation Vi",
                        },
                    };
                }
                return {
                    translation: {
                        key: "Static Data Translation En",
                    },
                };
            },
        };
        translationManager = new TranslationManager();
        translationManager.init(options);
    });

    it("should not change language when languageId is empty", async () => {
        //Act
        await translationManager.changeLanguage("");

        //Assert
        expect(translationManager.options.languageId).toBe("en");
    });

    it("should translate using Polyglot when isUseTolgeeRealTime is false", () => {
        //Arrange
        translationManager.options.isUseTolgeeRealTime = false;
        const key = "translation.key";
        const options: InterpolationOptions = { var: "value" };

        //Act
        const result = translationManager.translate(key, options);

        //Assert
        expect(result).toBe(`Static Data Translation En`);
    });

    it("should call options.onLoaded when isUseTolgeeRealTime is true and Tolgee is ready", () => {
        //Assert
        expect(translationManager.options.onLoaded).toHaveBeenCalled();
    });

    it("should call options.onLoaded when isUseTolgeeRealTime is false", () => {
        //Arrange
        translationManager.options.isUseTolgeeRealTime = false;
        const options: TranslationOptions = {
            languageId: "en",
            tolgeeUrl: "",
            isUseTolgeeRealTime: false,
            getStaticData: (languageId: string) => {
                return {
                    translation: {
                        key: "Static Data Translation Vi",
                    },
                };
            },
            onLoaded: jest.fn(),
        };

        //Act
        translationManager.init(options);

        //Assert
        expect(options.onLoaded).toHaveBeenCalled();
    });

    it("should return default languageId when options is not available", () => {
        //Arrange
        translationManager.options.availableLanguages = undefined;

        //Act
        const languageId = translationManager.getLanguageId();

        //Assert
        expect(languageId).toBe(translationManager.defaultLanguageId);
    });

    it("should return default languageId when current language is not available in options", () => {
        //Arrange
        localStorage.setItem("current_language", "es");

        //Act
        const languageId = translationManager.getLanguageId();

        //Assert
        expect(languageId).toBe(translationManager.defaultLanguageId);
    });

    it('should return languageId from URL params when "lang" param is provided', () => {
        //Arrange
        // const url = "https://example.com/?lang=vi";
        // const urlSearchParamsMock = new URLSearchParams(url);
        //global.window = Object.create(window);
        Object.defineProperty(window, "location", {
            value: {
                search: `?lang=vi-VN`,
            },
        });

        //Act
        const languageId = translationManager.getLanguageId();

        //Assert
        expect(languageId).toBe("vi");
    });

    it('should return languageId from decoded URL params when "params" param is provided', () => {
        //Arrange
        const encodedParams = btoa("lang=vi-VN");
        //global.window = Object.create(window);
        Object.defineProperty(window, "location", {
            value: {
                search: `?params=${encodedParams}`,
            },
        });

        //Act
        const languageId = translationManager.getLanguageId();

        //Assert
        expect(languageId).toBe("vi");
    });

    it("should use gameNamespace when calling gameTranslate", () => {
        //Arrange
        translationManager.options.gameNamespaces = ["GameNamespace"];
        const key = "key";
        const options: InterpolationOptions = { var: "value" };
        translationManager.options.getStaticData = (languageId: string) => {
            return {
                GameNamespace: {
                    key: "Value with game namepsace",
                },
            };
        };
        translationManager.loadPolygrot();

        //Act
        const result = translationManager.gameTranslate(key, options);

        //Assert
        expect(result).toBe("Value with game namepsace");
    });

    it('should use "Common" namespace when calling commonTranslate', () => {
        //Arrange
        translationManager.options.gameNamespaces = ["GameNamespace"];
        const key = "key";
        const options: InterpolationOptions = { var: "value" };
        translationManager.options.getStaticData = (languageId: string) => {
            return {
                Common: {
                    key: "Value with common",
                },
            };
        };
        translationManager.loadPolygrot();

        //Act
        const result = translationManager.commonTranslate(key, options);

        //Assert
        expect(result).toBe(`Value with common`);
    });
});
