import { FormatUtils } from "../../../../src/shared/utils";

describe("FormatUtils", () => {
    describe("formatOdds", () => {
        const testCases = [
            [2, true, "1:1"],
            [3, false, "1:3"],
            [4, true, "3:1"],
            [5, false, "1:5"],
        ];

        test.each(testCases)('formatOdds(%p, %p) returns "%p"', (value, fractional, expected) => {
            expect(FormatUtils.formatOdds(+value, !!fractional)).toBe(expected);
        });
    });

    describe("formatNumberWithCommas", () => {
        const testCases = [
            ["1000", "1,000"],
            ["12345", "12,345"],
            ["1234567", "1,234,567"],
            ["123456789", "123,456,789"],
            ["100", "100"],
            ["50", "50"],
            ["0", "0"],
            ["123.45", "123.45"],
            ["1234.567", "1,234.567"],
            ["9876543.21", "9,876,543.21"],
            ["0.123", "0.123"],
            ["0.12345", "0.12345"],
            ["10.5", "10.5"],
            ["1000000.99", "1,000,000.99"],
        ];

        test.each(testCases)('formatNumberWithCommas("%s") returns "%s"', (input, expected) => {
            expect(FormatUtils.numberWithCommas(+input, 6)).toBe(expected);
        });

        it("should handle empty decimal part", () => {
            expect(FormatUtils.numberWithCommas(+ "1234.", 6)).toBe("1,234");
        });

        it("should handle numbers with many decimal places", () => {
            expect(FormatUtils.numberWithCommas(+ "12345.123456789", 5)).toBe("12,345.12346");
        });

        it("should handle very large numbers", () => {
            expect(FormatUtils.numberWithCommas(+ "1234567890123", 4)).toBe("1,234,567,890,123");
        });
    });

    describe("numberWithCommas", () => {
        const testCases = [
            [1000, 1, true, "1,000"],
            [12345.67, 2, false, "12,345.67"],
            [3.8, 2, true, "3.8"],
            [3.8, 2, false, "3.80"],
            [0, 1, true, "0"],
            [50000, 0, true, "50,000"],
            [12345.6755555513123, 2, false, "12,345.68"],
            [0.075, 2, false, "0.08"],
        ];

        test.each(testCases)('numberWithCommas(%p, %p, %p) returns "%p"', (number, toFixed, noZeroSuffix, expected) => {
            expect(FormatUtils.numberWithCommas(+number, +toFixed, !!noZeroSuffix)).toBe(expected);
        });
    });

    describe("truncateFixedDecimals", () => {
        const testCases = [
            [3.14159, 2, "3.14"],
            [10.12345, 3, "10.123"],
            [123.456, 0, "123"],
            [-5.6789, 1, "-5.6"],
        ];

        test.each(testCases)("truncates %p to %p decimal places and returns %p", (number, fixed, expected) => {
            const result = FormatUtils.truncateFixedDecimals(+number, +fixed);
            expect(result).toBe(expected);
        });
    });

    describe("formatXMode", () => {
        const testCases = [
            [100, 1, 100],
            [100, 2, 200],
            [50.5, 3, 151.5],
            [1.234567, 1, 1.234567],
            [1.23456789, 2, 2.469136],
            [0.123456789, 10, 1.234568],
            [999.999, 0.5, 499.9995],
            [0, 5, 0],
            [100, undefined, 100], // default xMode = 1
            [-50, 2, -100],
            [1.111111111, 1.5, 1.666667],
            [0.0000001, 1000000, 0.1],
        ];

        test.each(testCases)("formatXMode(%p, %p) returns %p", (value, xMode, expected) => {
            const numValue = Number(value);
            if (xMode === undefined) {
                expect(FormatUtils.formatXMode(numValue)).toBe(expected);
            } else {
                expect(FormatUtils.formatXMode(numValue, Number(xMode))).toBe(expected);
            }
        });

        it("should handle precision correctly with 6 decimal places", () => {
            const result = FormatUtils.formatXMode(1.23456789123456, 1);
            expect(result).toBe(1.234568);
        });

        it("should round correctly at the 6th decimal place", () => {
            const result = FormatUtils.formatXMode(0.11111111, 1);
            expect(result).toBe(0.111111);
        });
    });
});
