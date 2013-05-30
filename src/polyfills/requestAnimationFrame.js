/*global define*/
define(['util/clock'], function(clock) {

    'use strict';

    /**
     * @module polyfills/requestAnimationFrame
     * @private
     */

    /* TODO: Camel case filename is inconsistent */

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    // requestAnimationFrame polyfill by Erik Möller
    // fixes from Paul Irish and Tino Zijdel

    var fixRequestAnimationFrame = function() {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = clock.now();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    };

    var fixCancelAnimationFrame = function() {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    };

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
                                   window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        fixRequestAnimationFrame();
    }

    if (!window.cancelAnimationFrame) {
        fixCancelAnimationFrame();
    }

    /**
     * Overrides the clock and requestAnimationFrame to allow predictable timings
     * in unit tests.
     * @function module:polyfills/requestAnimationFrame#overrideClock
     */
    return function() {
        clock.fixedOutput();
        fixRequestAnimationFrame();
        fixCancelAnimationFrame();
    };
});
