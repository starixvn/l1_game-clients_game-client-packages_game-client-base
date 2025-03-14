import { GameUtils } from "../../../../src/shared/utils/game-utils";
import { BrowserDomUtils } from "../../../../src/shared/utils/browser-dom-utils";

jest.mock("../../../../src/shared/utils/browser-dom-utils");
const mockNavigator = {
    clipboard: {
        writeText: jest.fn(),
    },
};

Object.defineProperty(global, "navigator", {
    value: mockNavigator,
    writable: true,
});

describe("GameUtils", () => {
    describe("base64Decode", () => {
        it("should decode a base64-encoded string", () => {
            // arrange
            const encoded = "SGVsbG8gV29ybGQ=";

            // act
            const decoded = GameUtils.base64Decode(encoded);

            // assert
            expect(decoded).toBe("Hello World");
        });
    });

    describe("base64Encode", () => {
        it("should encode a string as base64", () => {
            // arrange
            const decoded = "Hello World";

            // act
            const encoded = GameUtils.base64Encode(decoded);

            // assert
            expect(encoded).toBe("SGVsbG8gV29ybGQ=");
        });
    });

    describe("copyToClipboard", () => {
        it("should writeText to clipboard when navigator.clipboard is supported", async () => {
            // arrange
            const data = "Hello World";
            mockNavigator.clipboard.writeText.mockImplementation(() => Promise.resolve());

            // act
            const actual = await GameUtils.copyToClipboard(data);

            // assert
            expect(actual).toBe(true);
        });

        it("should postMessageToParent when navigator.clipboard is not supported", async () => {
            // arrange
            const data = "Hello World";
            mockNavigator.clipboard.writeText.mockRejectedValueOnce(new Error("Clipboard not supported"));

            // act
            await GameUtils.copyToClipboard(data);

            // assert
            expect(BrowserDomUtils.postMessageToParent).toHaveBeenCalledWith({ copyToClipboard: data });
        });
    });
});
