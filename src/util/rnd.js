/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/rnd
     */

    /** Return a random integer.
     * @function module:util/rnd#rnd
     * @param min Lowest possible value
     * @param max Highest possible value
     */
    var rnd = function(min,max) {
        return min+Math.random()*(max-min+1)|0;
    };

    /** Return a random float.
     * @function module:util/rnd#rndFloat
     * @param min Lowest possible value
     * @param max Highest possible value
     */
    var rndFloat = function(min,max) {
        return min+Math.random()*(max-min+1);
    };

    var genRands = function(min, max, setsize, fn) {
        var lut = [];
        setsize = setsize||10000;
        for (var i=setsize; i>0; i--) {
            lut.push(fn(min, max));
        }

        var pos = 0;

        return function() {
            pos++;
            if (pos===lut.length) {
                pos = 0;
            }
            return lut[pos];
        };
    };

    return {

        rnd: rnd,

        rndFloat: rndFloat,

        /** Generates a function that returns a faster random integer
         * generator, but which has a setup cost. If you're generating a very large
         * number of random numbers, this is significantly faster.
         * <p>
         * See {@link http://jsperf.com/precalc-random-numbers|jsperf.com}
         * <p>
         * e.g.
         * <pre>
         * // This bit is slow
         * var nextRand = rnd.fastRand(1, 10);
         * // This bit is fast
         * var n = nextRand();
         * <pre>
         * @function module:util/rnd#fastRand
         * @param {Number} min Lowest possible value
         * @param {Number} max Highest possible value
         * @param {Number} setsize Optional. The number of values to
         * precalculate.
         */
        fastRand: function(min, max, setsize) {
            return genRands(min, max, setsize, rnd);
        },

        /** Generates a function that returns a faster random float
         * generator, but which has a setup cost. If you're generating a very large
         * number of random numbers, this is significantly faster.
         * <p>
         * See {@link http://jsperf.com/precalc-random-numbers|jsperf.com}
         * <p>
         * e.g.
         * <pre>
         * // This bit is slow
         * var nextRand = rnd.fastRandFloat(0, 1);
         * // This bit is fast
         * var n = nextRand();
         * <pre>
         * @function module:util/rnd#fastRandFloat
         * @param {Number} min Lowest possible value
         * @param {Number} max Highest possible value
         * @param {Number} setsize Optional. The number of values to
         * precalculate.
         */
        fastRandFloat: function(min, max,setsize) {
            return genRands(min, max, setsize, rndFloat);
        }

    };

});
