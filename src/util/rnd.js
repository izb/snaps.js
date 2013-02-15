define(function() {

    'use strict';

    /* TODO: Speed test this file to see if it's bollocks. */

    /** Return a random integer.
     * @param min Lowest possible value
     * @param max Highest possible value
     */
    var rnd = function(min,max) {
        return min+Math.random()*(max-min+1)|0;
    };

    return {

        rnd: rnd,

        /** Generates a function that returns a faster random number
         * generator, but which has a setup cost.
         * e.g.
         * var nextRand = rnd.fastRand(1, 10); // The slow bit
         * var n = nextRand(); // The fast bit
         * @param min Lowest possible value
         * @param max Highest possible value
         */
        fastRand: function(min, max) {
            var lut = [];
            for (var i=10000; i>0; i--) {
                lut.push(rnd(min, max));
            }

            var pos = 0;

            return function() {
                pos++;
                if (pos===lut.length) {
                    pos = 0;
                }
                return lut[pos];
            };
        }

    };

});
