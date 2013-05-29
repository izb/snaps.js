/*global define*/
define(function() {

    'use strict';

    var sn;

    /**
     * @module plugins/sprite/flock
     */

    /**
     * This plugin tracks groups of sprites and moves them together using the boids flocking
     * algorithm.
     * <p>
     * This plugin supports phasers and will flock more efficiently, but with less
     * accuracy with phased updates.
     * <p>
     * Note that this plugin will not move the sprites, it only calculates velocity. To move the
     * sprites you should add the {@link module:plugins/sprite/apply-velocity.ApplyVelocity|apply-velocity}
     * plugin after this one as a commit update. In this way the sprites accurately update based on
     * their positions at the same moment in time.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>update:[{name:'flock'}]</code>.
     * <p>
     * See The <code>opts<code> parameter in the {@link module:sprites/sprite.Sprite|Sprite constructor}
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>tracker</dt><dd>Pass a tracker object here. See ProximityTracker. Sprites that flock
     *  with the same tracker will belong to the same flock. You should also apply the
     *  {@link module:plugins/sprite/track.Track|track plugin} to track the sprite in the
     *  {@link module:ai/proximity-tracker.ProximityTracker|proximity tracker}.</dd>
     *  <dt>flock_speed</dt><dd>In pixels/second. This is the maximum speed for any flockmate.</dd>
     *  <dt>flock_neighborhood</dt><dd>The radius that defines the influential
     *  flockmates, in pixels. Larger is generally better but slower, dependant on the tracker.</dd>
     *  <dt>flock_separation</dt><dd>This is the desired distance between flockmates. Flock pressure
     *  may force them closer together, but you can increase this to try to force them further apart.</dd>
     *  <dt>flock_neighbor_limit</dt><dd>If you're experiencing slow performance, try setting a neighbor
     *  limit. This limits the flockmates that can influence a sprite to a set number of closest neighbors.
     *  This degrades the quality of the flocking behavior. To include all flockmates, set this to a very
     *  high number.</dd>
     *  <dt>flock_steering</dt><dd>Pass a function here to control the flock. The function should be of the form
     *  <pre>
     *  flock_steering: function(sprite, out) {
     *      out[0]=1;
     *      out[1]=0;
     *  }
     *  </pre>
     *  And should steer each flockmate accordingly by populating the passed in spanned 2-length array with x,y
     *  values. In the above example, the values 1,0 will guide the sprite eastwards. In a real example, your code
     *  might determine the map tile that a sprite is on and guide it along a path, or simply move it on a
     *  vector towards some known point.
     *  </dd>
     * </dl>
     * @constructor module:plugins/sprite/flock.Flock
     */
    function Flock() {
        /* TODO: Docs - Show an example of a complete flocked sprite with all required plugins. */
        /* TODO: Add support for phased updates */
        /* TODO: Try making a flock of 1. It just spins round and acts weird. Work out if that's expected
         * or indicative of some bug. */
        this.xy  = [0,0];
        this.xy2 = [0,0];
    }

    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @method module:plugins/sprite/flock.Flock#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Flock.prototype.update = function(now, phaseOn) {

        var dt, mag, count;
        if (this.lastTime===undefined) {
            dt = 16;
        } else {
            dt = now - this.lastTime;
        }
        this.lastTime = now;

        var x = 0, y = 0, i, dx, dy, d, d2, n;
        var s = this.sprite;

        var neighbors = this.tracker.find(s.x, s.y, this.flock_neighborhood, true);

        /* TODO: Maintain current direction.
         *
         * TODO: Should phasing alter weights?
         *
         * TODO: We assume flock_neighborhood>=flock_separation. Enforce this with a check, or
         * make it so it doesn't need to be.
         */

        var weightSeparation = 1;
        var weightAlignment  = 1.2; /* Acts as a limiter on the magnitude of this vector */
        var weightCohesion   = 1;
        var weightSteering   = 3;
        var weightInertia    = 0.95;

        /* steering */

        this.flock_steering(s, this.xy);

        this.xy[0] = this.xy[0] * weightSteering;
        this.xy[1] = this.xy[1] * weightSteering;

        /* cohesion: Find average location of neighbours for cohesion vector */

        count = Math.min(this.flock_neighbor_limit, neighbors.length);
        if (count>0) {
            for (i = count - 1; i >= 0; i--) {
                n = neighbors[i];
                x+=n.x;
                y+=n.y;
            }
            x=x/count;
            y=y/(count/2); /* /2 to convert from screen to world space for isometric */
            s.vectorTo(x, y, this.xy2);
            this.xy[0] = this.xy[0] + weightCohesion * this.xy2[0];
            this.xy[1] = this.xy[1] + weightCohesion * this.xy2[1];
        }

        /* alignment: average vector of neighbours */

        if (count>0) {
            for (x = 0, y = 0, i = count - 1; i >= 0; i--) {
                n = neighbors[i];
                x+=n.velocityx;
                y+=n.velocityy;
            }
            x=x/count;
            y=y/(count/2); /* /2 to convert from screen to world space for isometric */
            mag = (x*x)+(y*y);
            if (mag>(weightAlignment*weightAlignment)) {
                mag = Math.sqrt(mag);
                x = weightAlignment * x/mag;
                y = weightAlignment * y/mag;
            }
            this.xy[0] = this.xy[0] + x;
            this.xy[1] = this.xy[1] + y;
        }

        /* separation: Any flockmates that are too close should repel the sprite. */
        count = 0;
        for (x = 0, y = 0, i = 0; i < neighbors.length; i++) {
            n = neighbors[i];
            if (s.nuid===n.nuid) {
                continue;
            }
            dx = s.x - n.x;
            dy = 2*(s.y - n.y); /* Double to convert from screen to world-space in isometric */
            d2 = (dx*dx)+(dy*dy);

            if (d2>this.flock_separation2) {
                break;
            }

            if (d2===0) {
                /* Force coincident sprites apart, just in case they have no inertia */
                dx = s.nuid>n.nuid?0.5:-0.5;
                d2 = 0.25;
            }

            count++;

            dx=dx/d2;
            dy=dy/d2;

            x+=dx;
            y+=dy;
        }

        if (count>0) {
            mag = Math.sqrt((x*x)+(y*y));
            this.xy[0] = this.xy[0] + weightSeparation*(x/mag);
            this.xy[1] = this.xy[1] + weightSeparation*(y/mag);
        }

        /* update velocity */

        s.velocityx = weightInertia * s.velocityx + this.xy[0];
        s.velocityy = weightInertia * s.velocityy + this.xy[1];

        var maxSpeed = this.flock_speed * dt/1000;
        mag = (s.velocityx*s.velocityx)+(s.velocityy*s.velocityy);
        if (mag>(maxSpeed*maxSpeed)) {
            mag = Math.sqrt(mag);
            if (mag<1) {
                mag = 1;
            }
            s.velocityx = maxSpeed * s.velocityx/mag;
            s.velocityy = maxSpeed * s.velocityy/mag;
        }

        if (s.velocityx<0.01 && s.velocityx>-0.01 && s.velocityy<0.01 && s.velocityy>-0.01) {
            s.velocityy = s.velocityx = 0;
        }

        return true;
    };

    /**
     * @method module:plugins/sprite/flock.Flock#init
     * @private
     */
    Flock.prototype.onSpriteRemoved = function() {
    };

    /**
     * @method module:plugins/sprite/flock.Flock#init
     * @private
     */
    Flock.prototype.init = function(s) {
        this.sprite = s;

        /* Some sensible defaults */

        if (this.flock_speed===undefined) {
            this.flock_speed = 120;
        }

        if (this.flock_neighborhood===undefined) {
            this.flock_neighborhood = 50;
        }

        if (this.flock_separation===undefined) {
            this.flock_separation = Math.min(20, this.flock_neighborhood / 2);
        }
        this.flock_separation2 = this.flock_separation*this.flock_separation;

        if (this.flock_neighbor_limit===undefined) {
            this.flock_neighbor_limit = 5;
        }
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('flock', Flock);
    };

});
