define(function() {

    'use strict';

    function TraceCollider(opts) {
        this.opts = opts;

        /* TODO: Whisker range option */

        /* TODO: Do something */
    }

    /** FX plugin callbacks should return true to continue, or false if complete.
     * Should be called with context set to the sprite.
     * @return {Boolean} See description
     */
    TraceCollider.prototype.test = function(x,y,dx,dy) {
        return false;
    };

    return function(sn) {
        sn.registerColliderPlugin('trace', TraceCollider, function(){});
    };

});
