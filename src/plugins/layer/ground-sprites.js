/*global define*/
define(['sprites/sprite',
        'util/uid'],

function(Sprite, uid) {

    'use strict';

    /**
     * @module plugins/layer/ground-sprites
     */

    var sn;

    /**
     * A layer that holds normally flat sprites that are intended to be drawn after the
     * ground, but before the buildings and other sprites.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * <code>sn.addLayer('ground-sprites')</code> on the engine.
     * @constructor module:plugins/layer/ground-sprites.GroundSprites
     * @param {String} layerName A name for the layer. You might see it later on in
     * error messages.
     * @param {Object} opts Parameters for customizing the layer. There are no parameters
     * for this layer plugin though, so feel free not to pass any in.
     */
    function GroundSprites(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
        this.sprites = [];
        this.spriteMap = {};
    }

    /**
     * @method module:plugins/layer/ground-sprites.GroundSprites#update
     * @private
     */
    GroundSprites.prototype.update = function(now) {
    };

    /**
     * @method module:plugins/layer/ground-sprites.GroundSprites#draw
     * @private
     */
    GroundSprites.prototype.draw = function(ctx, now) {

        var map = sn.map;
        /* TODO: Sort sprites if sprites are not static. */
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            this.sprites[i].draw(ctx, map.xoffset, map.yoffset, now);
        }
    };

    /**
     * Remove all sprites from the layer.
     * @method module:plugins/layer/ground-sprites.GroundSprites#purgeAll
     */
    GroundSprites.prototype.purgeAll = function() {
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            this.sprites[i].onRemove();
        }
        this.sprites = [];
        this.spriteMap = {};
    };

    /**
     * Spawn a new sprite on the ground plane
     * @method module:plugins/layer/ground-sprites.GroundSprites#spawnSprite
     * @param defName The name of the sprite definition to use. These are
     * set up in your game's spriteDefs data.
     * @param stateName The initial state. This too is defined in the
     * sprite's definition, in your game's spriteDefs data.
     * @param stateExt The initial state extension. This too is defined in the
     * sprite's definition, in your game's spriteDefs data.
     * @param {Function/Number} x The world x coordinate. If a function, it should take
     * no parameters and return a number.
     * @param {Function/Number} y The world y coordinate. If a function, it should take
     * no parameters and return a number.
     * @param {Object} [opts] Optional parameter object. See sn.spawnSprite for sprite
     * spawn option values.
     */
    GroundSprites.prototype.spawnSprite = function(defName, stateName, stateExt, x, y, opts) {

        /* TODO: Docs - link to spawnSprite in opts param */

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
