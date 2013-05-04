/*global define*/
define(function() {

    'use strict';

    var sn;

    /* TODO: Docs - in all docs, add a description to the module tag */

    /**
     * @module plugins/sprite/8way
     */

    /**
     * A sprite updater that sets the sprite's state extension to a compass direction
     * ('n', 'ne', 'e', 'se'...)
     * based on the direction values in the sprite. Direction updates automatically when the sprite
     * moves but can be overridden with setDirection. The compass direction takes into account the
     * isometric projection.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>updates:[{name:'8way'}]</code>.
     * <p>
     * This plugin takes no options.
     * @constructor module:plugins/sprite/8way.Face8Way
     */
    function Face8Way() {
        /* TODO: Docs. Link to Sprite#setDirection, and also spawnSprite(s) or composite sprites */
    }

    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @method module:plugins/sprite/8way.Face8Way#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return {Boolean} true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Face8Way.prototype.update = function(now, phaseOn) {

        var s = this.sprite;

        var dx = s.directionx - s.x;
        var dy = 2*(s.directiony - s.y); /* Because Y is halved in isometric land */

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

        this.oldx = s.x;
        this.oldy = s.y;

        s.setState(s.stateName, this.direction);

        return true;
    };

    /**
     * @method module:plugins/sprite/8way.Face8Way#init
     * @private
     */
    Face8Way.prototype.init = function(sprite) {
        this.sprite = sprite;
        this.direction = 'e';
    };

    /**
     * @method module:plugins/sprite/8way.Face8Way#onSpriteRemoved
     * @private
     */
    Face8Way.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('8way', Face8Way);
    };

});
