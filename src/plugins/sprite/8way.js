define(function() {

    'use strict';

    var sn;

    /** Called with the sprite as the 'this' context.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    var face8way = function() {

        var dx = this.directionx - this.x;
        var dy = 2*(this.directiony - this.y); /* Because Y is halved in isometric land */

        var d;

        if (dy===0) {
            if (dx===0) {
                d = this.direction;
            } else {
                d = dx>0?'e':'w';
            }
        } else {
            /* dy!=0 => Division is ok */
            var r = dx/dy;
            if (r>=0) {
                if (r < 0.41421) {
                    d = dy>0?'s':'n';
                } else if(r > 2.4142) {
                    d = dx>0?'e':'w';
                } else {
                    d = dx>0?'se':'nw';
                }
            } else {
                if (r > -0.41421) {
                    d = dy>0?'s':'n';
                } else if(r < -2.4142) {
                    d = dx>0?'e':'w';
                } else {
                    d = dx>0?'ne':'sw';
                }
            }
        }

        this.direction = d;

        this.oldx = this.x;
        this.oldy = this.y;

        this.setState(this.stateName, this.direction);

        return true;
    };

    var init = function() {
        this.direction = 'e';
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('8way', face8way, init);
    };

});
