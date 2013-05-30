/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/clock
     */

    /**
     * Construct a clock.
     * @constructor module:util/clock.Clock
     * @private
     */
    function Clock() {
    }

    /**
     * Gets the current time.
     * @function module:util/clock#now
     * @return {Number} The current time as a millisecond timer value.
     */
    Clock.prototype.now = function() {
        return +new Date();
    };

    /**
     * Fixes the output of the clock to predictable values to aid unit testing.
     * @function module:util/clock#fix
     * @private
     */
    Clock.prototype.fixedOutput = function() {
        this.now = function() {
            /* TODO */
            return +new Date();
        };
    };


    return new Clock();
});
