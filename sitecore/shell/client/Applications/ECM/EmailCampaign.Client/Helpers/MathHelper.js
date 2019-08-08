define([], function () {
    var MathHelper = {
        divide: function (numerator, denominator, decimals) {
            var result;

            if (MathHelper.isZero(denominator)) {
                return null;
            } else {
                result = (numerator / denominator);
                if (decimals) {
                    result = parseFloat(result.toFixed(decimals));
                }
                return result;
            }
        },

        percentage: function (num1, num2) {
            return parseFloat((new Number(MathHelper.divide(num1, num2)) * 100).toFixed(2));
        },

        isZero: function (n) {
            n = +n;
            if (!n) {
                return true;
            }
            return false;
        },

        abbreviateNumber: function(num, fixed) {
            if (num === null || num === undefined) {
	             return null;
            }
            if (num === 0) {
	             return '0';
            } 
            var e = (num).toPrecision(2).split('e'),
                charIndex = e.length === 1 ? 0 : Math.floor(Math.min(e[1].slice(1), 14) / 3),
                c = charIndex < 1 ? num.toFixed(fixed) : (num / Math.pow(10, charIndex * 3)).toFixed(fixed),
                d = c < 0 ? c : Math.abs(c),
                exp = d + ['', 'K', 'M', 'B', 'T'][charIndex];

            return exp;
        },

        isInt: function(n) {
            return Number(n) === n && n % 1 === 0;
        },

        isFloat: function (n) {
            return Number(n) === n && n % 1 !== 0;
        }
    };

    return MathHelper;
});