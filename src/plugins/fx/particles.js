define([
    'sprites/sprite',
    'sprites/composite',
    'util/rnd'
], function(Sprite, Composite, utilRnd) {

    'use strict';

    var sn;

    var rnd = utilRnd.rnd;

    /** Spawns particles in a composite sprite.
     * @param {Object} opts Options, in the following format
     * {
     *     number: {Function/Number}, // The number of particles to spawn, either a number or a function
     *     def: {String}, // The sprite definition to spawn
     *     state: {String}, // The sprite state to spawn
     *     duration: {Function/Number}, // The time cap on the particle animation. Individual sprites may outlive this.
     *     x: {Number}, // X world position to spawn particles
     *     y: {Number}, // Y world position to spawn particles
     *     TODO: More!
     * }
     */
    function Particles(opts) {
        this.opts = opts;

        var number = (typeof opts.number === "number")?opts.number:opts.number();

        this.comp = sn.createComposite(opts.x, opts.y, opts.h, opts.name, opts.endCallback);

        while(number-->0) {
            var so = opts.spritePos||{x:0,y:0,h:0};
            var s = this.comp.addSprite(opts.def, opts.state, so.x||0, so.y||0, so.h||0, opts.spriteOpts);
            s.particleData = {
                xspeed: rnd(-10,10),
                hspeed: rnd(-10,20)
            };
        }
    }

    var updateSprite = function() {
        var pd = this.particleData;
        this.x+=pd.xspeed;
        this.h+=pd.hspeed;
        pd.hspeed-=1;
        if (this.h<0) {
            this.h=0;
        }
    };

    /** FX plugin callbacks should return true to continue, or false if complete.
     * @return {Boolean} See description
     */
    Particles.prototype.update = function(now) {
        this.comp.update(now, updateSprite);
        return this.comp.isActive();
    };

    return function(snaps) {
        sn = snaps;
        sn.registerFxPlugin('particles', Particles);
    };

});
