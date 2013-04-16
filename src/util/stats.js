/*global define*/
define(function() {

    'use strict';

    function Stats() {
        this.samples = {};
        this.totals = {};
        this.averages = {};
    }

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
