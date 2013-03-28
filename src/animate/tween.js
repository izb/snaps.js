/*global define*/
define(function() {

    'use strict';

    /* Via http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm */

    /*
     * In all tween functions:
     * t = Current time passed since the beginning of the animation. Must be >=0.
     * Will be clamped to the duration.
     * b = The start value of the property being tweened
     * c = The desired delta. E.g. if b = 10, and you want to tween it to 30, c
     * should be 20
     * d = The duration in the same units as t.
     *
     * For the effects you should know that quintic is softer than quadratic,
     * which is softer than cubic.
     */

    return {
        linear: function(t, b, c, d)
        {
            return b+c*Math.min(1,t/d);
        },

        easeInOutCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-2*tc + 3*ts);
        },

        easeInOutQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(6*tc*ts + -15*ts*ts + 10*tc);
        },

        easeInQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc*ts);
        },

        easeInQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            return b+c*(ts*ts);
        },

        easeInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var tc=(t/=d)*t*t;
            return b+c*(tc);
        },

        easeInQuadratic: function(t, b, c, d) {
            t=Math.min(d,t);
            return b+c*(t*t/d);
        },

        easeOutQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc*ts + -5*ts*ts + 10*tc + -10*ts + 5*t);
        },

        easeOutQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-1*ts*ts + 4*tc + -6*ts + 4*t);
        },

        easeOutCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc + -3*ts + 3*t);
        },

        /** Opposite of easing in and out. Starts and ends linearly, but
         * comes to a pause in the middle.
         */
        easeOutInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -6*ts + 3*t);
        },

        /** Moves back first before easing in.
         */
        backInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -3*ts);
        },

        /** Moves back first before easing in.
         */
        backInQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(2*ts*ts + 2*tc + -3*ts);
        },

        /** Overshoots, then eases back
         */
        outBackCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -9*ts + 6*t);
        },

        /** Overshoots, then eases back
         */
        outBackQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-2*ts*ts + 10*tc + -15*ts + 8*t);
        },

        /** Bounces around the target point, then settles.
         */
        bounceOut: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(33*tc*ts + -106*ts*ts + 126*tc + -67*ts + 15*t);
        },

        /** Bounces around the start point, then moves quickly to the target.
         */
        bounceIn: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(33*tc*ts + -59*ts*ts + 32*tc + -5*ts);
        }
    };

});
