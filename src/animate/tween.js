/*global define*/
define(function() {

    'use strict';

    /* Via http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm */

    /**
     * @module animate/tween
     */
    return {

        /**
         * Simple linear tween.
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        linear: function(t, b, c, d)
        {
            return b+c*Math.min(1,t/d);
        },

        /**
         * Eases in and out of the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInOutCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-2*tc + 3*ts);
        },

        /**
         * Eases softly in and out of the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInOutQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(6*tc*ts + -15*ts*ts + 10*tc);
        },

        /**
         * Eases very softly into the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc*ts);
        },

        /**
         * Eases softly into the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            return b+c*(ts*ts);
        },

        /**
         * Eases into the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var tc=(t/=d)*t*t;
            return b+c*(tc);
        },

        /**
         * Eases quickly into the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInQuadratic: function(t, b, c, d) {
            t=Math.min(d,t);
            return b+c*(t*t/d);
        },

        /**
         * Eases very softly out of the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeOutQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc*ts + -5*ts*ts + 10*tc + -10*ts + 5*t);
        },

        /**
         * Eases softly out of the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeOutQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-1*ts*ts + 4*tc + -6*ts + 4*t);
        },

        /**
         * Eases out of the animation
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeOutCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc + -3*ts + 3*t);
        },

        /** Opposite of easing in and out. Starts and ends linearly, but
         * comes to a pause in the middle.
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeOutInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -6*ts + 3*t);
        },

        /** Moves back first before easing in.
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        backInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -3*ts);
        },

        /** Moves back first before easing in.
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        backInQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(2*ts*ts + 2*tc + -3*ts);
        },

        /** Overshoots, then eases back
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        outBackCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -9*ts + 6*t);
        },

        /** Overshoots, then eases back
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        outBackQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-2*ts*ts + 10*tc + -15*ts + 8*t);
        },

        /** Bounces around the target point, then settles.
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        bounceOut: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(33*tc*ts + -106*ts*ts + 126*tc + -67*ts + 15*t);
        },

        /** Bounces around the start point, then moves quickly to the target.
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        bounceIn: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(33*tc*ts + -59*ts*ts + 32*tc + -5*ts);
        }
    };

});
