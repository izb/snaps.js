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
     * moves but can be overridden with {@link module:sprites/sprite.Sprite#setDirection|setDirection}.
     * The compass direction takes into account the isometric projection.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>updates:[{name:'8way'}]</code>.
     * <p>
     * See The <code>opts<code> parameter in the {@link module:sprites/sprite.Sprite|Sprite constructor}
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>anti_jitter</dt><dd>Creates a buffer between direction changes. Waits a certain number
     *  of frames before changing the direction. The direction only changes if the new direction
     *  is not the current direction for a set number of frames. Defaults to 0.</dd>
     *  <dt>bounce_base</dt><dd>Where is the 'floor'? E.g. a bounce_base of 25 and an bounce height
     *  of 100 will bounce up 100px on top of the floor level of 25. The height value will
     *  be 125 at its apex, midway through the state animation.</dd>
     * </dl>
     * @constructor module:plugins/sprite/8way.Face8Way
     */
    function Face8Way() {
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

        this.oldx = s.x;
        this.oldy = s.y;

        if (this.anti_jitter) {
            this.jitterBuffer.push(d);
            if (this.jitterBuffer.length>this.anti_jitter) {
                this.jitterBuffer = this.jitterBuffer.slice(1);
            }
            for (var i = this.jitterBuffer.length - 1; i >= 0; i--) {
                var jd = this.jitterBuffer[i];
                if(jd===this.direction) {
                    return true;
                }
            }
            this.jitterBuffer = new Array(this.anti_jitter);
        }

        this.direction = d;

        s.morphState(s.stateName, this.direction);

        return true;
    };

    /**
     * @method module:plugins/sprite/8way.Face8Way#init
     * @private
     */
    Face8Way.prototype.init = function(sprite) {
        this.sprite = sprite;
        this.direction = 'e';

        if (this.anti_jitter) {
            this.jitterBuffer = new Array(this.anti_jitter);
        }
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
