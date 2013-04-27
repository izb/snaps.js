/*global define*/
define(['sprites/sprite',
        'util/uid'],

function(Sprite, uid) {

    'use strict';

    var sn;

    /* A layer that holds flat sprites that are intended to be drawn after the ground, but
     * before the buildings and other sprites. */

    /**
     * @param {Object} opts Parameters for customizing the layer.
     */
    function GroundSprites(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
        this.sprites = [];
        this.spriteMap = {};
    }

    GroundSprites.prototype.update = function(now) {
    };

    GroundSprites.prototype.draw = function(ctx, now) {

        var map = sn.map;
        /* TODO: Sort sprites if sprites are not static. */
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            this.sprites[i].draw(ctx, map.xoffset, map.yoffset, now);
        }
    };

    GroundSprites.prototype.purgeAll = function() {
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            this.sprites[i].onRemove();
        }
        this.sprites = [];
        this.spriteMap = {};
    };

    /**
     * Spawn a new sprite on the ground plane
     * @param defName The name of the sprite definition to use. These are
     * set up in your game's spriteDefs data.
     * @param stateName The initial state. This too is defined in the
     * sprite's definition, in your game's spriteDefs data.
     * @param {Function/Number} x The world x coordinate. If a function, it should take
     * no parameters and return a number.
     * @param {Function/Number} y The world y coordinate. If a function, it should take
     * no parameters and return a number.
     * @param {Function/Number} h The height off the ground. If a function, it should take
     * no parameters and return a number.
     * @param Optional parameter object, which can contain:
     * 'id' if you want to be able to find your sprite again.
     * 'maxloops' if your sprite should remove itself from the world
     * after it's looped around its animation a certain number of times. Can be a function, like
     * the world position parameters.
     * Normally you'd set this to 1 for things like explosions.
     * 'update' An array of functions that are called in-order for this
     * sprite.
     * 'endCallback' A function called when the sprite naturally ends
     */
    GroundSprites.prototype.spawnSprite = function(defName, stateName, stateExt, x, y, opts) {

        opts = opts||{};

        if (opts.id===undefined) {
            opts.id = uid();
        } else {
            if(sn.spriteMap.hasOwnProperty(opts.id)) {
                throw "Error: duplicate sprite id " + opts.id;
            }
        }

        var s = Sprite.construct(sn, defName, stateName, stateExt, x, y, 0, opts);

        /* TODO: If static sprites are set, insert at a sorted screen y position. */

        this.sprites.push(s);
        this.spriteMap[opts.id] = s;

        return s;
    };

    /* TODO: Spawn sprite on tile. */

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('ground-sprites', GroundSprites, function(){});
    };

});
