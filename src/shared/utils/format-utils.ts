export namespace FormatUtils {
    export const formatOdds = (value: number, fractional: boolean) => {
        return fractional ? `${numberWithCommas(+value - 1, 2)}:1` : `1:${value}`;
    };

    const formatCommasReg = /\B(?=(\d{3})+(?!\d))/g;
    const formatNumberWithCommas = (numberString: string): string => {
        const [integerPart, decimalPart] = numberString.split('.');
        const formattedInteger = integerPart.replace(formatCommasReg, ",");
        return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    };

    export const numberWithCommas = (number: number, toFixed = 1, noZeroSuffix = true) => {
        if (number) {
            let trimZeroNumber: string;
            const inputNumber = +number;
            const multiplier = Math.pow(10, toFixed);
            const roundedNumber = Math.round(inputNumber * multiplier) / multiplier;
            if (noZeroSuffix) {
                trimZeroNumber = `${+(roundedNumber).toFixed(toFixed)}`;
            } else {
                trimZeroNumber = (roundedNumber).toFixed(toFixed);
            }
            
            return formatNumberWithCommas(trimZeroNumber);
        }

        return "0";
    };

    export const truncateFixedDecimals = (number: number, fixed: number) => {
        const withFixedDecimals = `${number}`.match(new RegExp(`^-?\\d+(?:\.\\d{0,${fixed}})?`))[0];
        const numberString = parseFloat(withFixedDecimals).toString();
        return formatNumberWithCommas(numberString);
    };

    export const nFormatter = (num, digits = 0) => {
        const si = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "K" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" },
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        let i;
        for (i = si.length - 1; i > 0; i--) {
            if (num >= si[i].value) {
                break;
            }
        }
        if (num < 1e3) {
            return `${num}`;
        }
        return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
    };
}
