/*global define*/
define(function() {

    'use strict';

    /** Return a random integer.
     * @param min Lowest possible value
     * @param max Highest possible value
     */
    var rnd = function(min,max) {
        return min+Math.random()*(max-min+1)|0;
    };

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

        /** Generates a function that returns a faster random number
         * generator, but which has a setup cost. If you're using a very large
         * number of random numbers, this is significantly faster.
         *
         * http://jsperf.com/precalc-random-numbers
         *
         * e.g.
         * var nextRand = rnd.fastRand(1, 10); // The slow bit
         * var n = nextRand(); // The fast bit
         * @param min Lowest possible value
         * @param max Highest possible value
         * @param {Number} setsize Optional. The number of values to
         * precalculate.
         */
        fastRand: function(min, max,setsize) {
            return genRands(min, max, setsize, rnd);
        },

        fastRandFloat: function(min, max,setsize) {
            return genRands(min, max, setsize, rndFloat);
        }

    };

});
