/*global define*/
define([
    'sprites/sprite',
    'sprites/composite',
    'util/rnd'
], function(Sprite, Composite, utilRnd) {

    'use strict';

    /**
     * @module plugins/fx/particles
     */

    var sn;

    var rnd = utilRnd.rnd;

    /** Spawns particles in a composite sprite.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * {@link module:snaps.Snaps#fx|fx} on the engine.
     * @constructor module:plugins/fx/particles.Particles
     * @param {Object} opts Options, in the following format
     * <dl>
     *  <dt>number</dt><dd>The number of particles to spawn, either a number or a function
     *    returning a number</dd>
     *  <dt>id</dt><dd>An optional ID for the new composite sprite</dd>
     *  <dt>def</dt><dd>The name of the sprite definition to spawn</dd>
     *  <dt>state</dt><dd>The sprite state to spawn</dd>
     *  <dt>duration</dt><dd>The time cap on the particle animation. Individual sprites may outlive this.
     *    Either a number or a function returning a number</dd>
     *  <dt>x</dt><dd>X world position to spawn particles
     *    Either a number or a function returning a number</dd>
     *  <dt>y</dt><dd>Y world position to spawn particles
     *    Either a number or a function returning a number</dd>
     *  <dt>endCallback</dt><dd>Called once the particles effect expires, or the composite sprite expires.</dd>
     * </dl>
     *
     * <p>
     * Note there is no height spec. Height is the domain of the individual sprite within the composite.
     *
     * <p>
     * An example of how to pass a random range into any Function/Number parameters would be to bind
     * the rnd function in util/rnd. E.g.
     *
     * <pre>
     * // Random range between -20 and 20:
     * var smallRange = rnd.bind(rnd,-20,20);
     * // Random range between 500 and 2000:
     * var largeRange = rnd.bind(rnd,500,2000);
     * // Fast cached random number set:
     * var fastRand = rnd.fastRand(10,20);
     *
     * sn.fx('particles', {
     *     number: 15,
     *     duration: largeRange,
     *     x:smallRange,
     *     y:smallRange
     *     // etc
     * });
     * </pre>
     *
     * <p>
     * Alternatively of course, you could provide your own custom parameterless number
     * generator and pass it in.
     */
    function Particles(opts) {
        this.opts = opts;

        var number = (typeof opts.number === "number")?opts.number:opts.number();

        var cx = typeof opts.x === 'function'?opts.x():opts.x;
        var cy = typeof opts.y === 'function'?opts.y():opts.y;

        this.duration = typeof opts.duration === 'function'?opts.duration():opts.duration;
        this.epoch = sn.getNow();

        this.endCallback = opts.endCallback;

        this.comp = sn.createComposite(cx, cy, opts.id);

        while(number-->0) {
            var so = opts.spritePos||{x:0,y:0,h:0};
            var s = this.comp.addSprite(opts.def, opts.state, so.x||0, so.y||0, so.h||0, opts.spriteOpts);
            s.particleData = {
                xspeed: rnd(-400,400)/1000,
                hspeed: rnd(-600,50)/1000,
                xaccell: 0,
                haccell: 0.001,
                startx: so.x||0,
                starth: so.h||0,
                epoch: this.epoch
            };
        }
    }

    var updateSprite = function(s, now) {
        var pd = s.particleData;
        var t = now - pd.epoch;
        var ts=t*t;
        s.x=Math.floor(pd.startx+(pd.xspeed*t+(pd.xaccell*ts)/2));
        s.h=Math.floor(pd.starth-(pd.hspeed*t+(pd.haccell*ts)/2));
        if (s.h<0) {
            s.h=0;
        }
    };

    /** FX plugin callbacks should return true to continue, or false if complete.
     * @method module:plugins/fx/particles.Particles#update
     * @return {Boolean} See description
     * @private
     */
    Particles.prototype.update = function(now) {
        this.comp.update(now, updateSprite.bind(this));
        if (this.duration!==undefined) {
            if ((now - this.epoch)>this.duration) {
                /* The particle effect will no longer manipulate the composite sprites and they will be
                 * left on-screen to expire in their own ways. */
                if (this.endCallback!==undefined) {
                    this.endCallback();
                }
                return false;
            }
        }

        var compActive = this.comp.isActive();
        if (!compActive && this.endCallback!==undefined) {
            /* All the sprites have expired in the composite, so we should expire this effect too. */
            this.endCallback();
        }
        return compActive;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerFxPlugin('particles', Particles);
    };

});
