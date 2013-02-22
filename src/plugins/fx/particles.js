define([
    'sprites/sprite',
    'sprites/composite'
], function(Sprite, Composite) {

    'use strict';

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

        this.number = (typeof opts.number === "number")?opts.number:opts.number();

        /* TODO: Spawn those particles! */
    }

    /** FX plugin callbacks should return true to continue, or false if complete.
     * @return {Boolean} See description
     */
    Particles.prototype.update = function(now) {
        return false;
    };

    return function(sn) {
        sn.registerFxPlugin('particles', Particles, function(){});
    };

});
