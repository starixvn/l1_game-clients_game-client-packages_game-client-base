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
            [5.5625, 4, true, "5.5625"],
            [5.5625, 4, false, "5.5625"],
            [5566.5625, 4, true, "5,566.5625"],
            [5566.5625, 4, false, "5,566.5625"],
            [55666578.5625, 4, true, "55,666,578.5625"],
            [55666578.5625, 4, false, "55,666,578.5625"],
            [55666578.56254332, 4, true, "55,666,578.5625"],
            [55666578.56255332, 4, false, "55,666,578.5626"],
            // 6 decimal places
            [1.123456, 6, true, "1.123456"],
            [1.123456, 6, false, "1.123456"],
            [1.1234, 6, true, "1.1234"],
            [1.1234, 6, false, "1.123400"],
            [1.123400, 6, true, "1.1234"],
            [12345.123456, 6, true, "12,345.123456"],
            [12345.123456, 6, false, "12,345.123456"],
            [12345.12345600, 6, true, "12,345.123456"],
            [12345.12345600, 6, false, "12,345.123456"],
            [12345.1234567891, 6, true, "12,345.123457"],
            [12345.1234564891, 6, false, "12,345.123456"],
            [9876543.123456, 6, true, "9,876,543.123456"],
            [9876543.123456, 6, false, "9,876,543.123456"],
            [0.000001, 6, true, "0.000001"],
            [0.000001, 6, false, "0.000001"],
            [0.0000014, 6, true, "0.000001"],
            [0.0000015, 6, false, "0.000002"],
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
            [1827.205, 2, "1,827.2"],
            [5.5625, 4, "5.5625"],
            [5.562578, 4, "5.5625"],
            [1827.2625, 4, "1,827.2625"],
            [1827.26205, 4, "1,827.262"],
            [1827.262005, 4, "1,827.262"],
            [5678.562578, 4, "5,678.5625"],
            // 6 decimal places
            [3.141592, 6, "3.141592"],
            [3.1415926535, 6, "3.141592"],
            [12345.123456, 6, "12,345.123456"],
            [12345.1234567891, 6, "12,345.123456"],
            [9876543.123456, 6, "9,876,543.123456"],
            [9876543.12345678, 6, "9,876,543.123456"],
            [0.000001, 6, "0.000001"],
            [0.0000019, 6, "0.000001"],
            [-1.123456, 6, "-1.123456"],
            [-1.1234567, 6, "-1.123456"],
            [-1.123456700, 6, "-1.123456"],
            [1000.100001, 6, "1,000.100001"],
            [1000.1000019, 6, "1,000.100001"],
        ];

        test.each(testCases)("truncates %p to %p decimal places and returns %p", (number, fixed, expected) => {
            const result = FormatUtils.truncateFixedDecimals(+number, +fixed);
            expect(result).toBe(expected);
        });
    });
});
