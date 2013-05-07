/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/stats
     */

    /**
     * Construct a stats recorder.
     * @constructor module:util/stats.Stats
     */
    function Stats() {

        this.samples = {};
        this.totals = {};

        /**
         * A named map of stats and their averages over the last 10 samples.
         * E.g. <code>stats.averages['fps'];</code>
         * @type {Object}
         * @member module:util/stats.Stats#averages
         */
        this.averages = {};
    }

    /**
     * Count a named stat. The last 10 recorded stats for each name will be stored
     * and accessible as averages.
     * @method module:util/stats.Stats#count
     * @param  {String} name The stat to count
     * @param  {Number} val  The new value for the stat
     */
    Stats.prototype.count = function(name, val) {
        var s, t;
        if (!this.samples.hasOwnProperty(name)) {
            s = [];
            t=0;
            this.samples[name] = s;
        } else {
            t = this.totals[name];
            s = this.samples[name];
        }
        s.push(val);
        t+=val;
        if (s.length>10) {
            t -= s[0];
            s.splice(0,1);
        }
        this.totals[name]=t;
        this.averages[name]=t/s.length;
    };


    return Stats;
});
