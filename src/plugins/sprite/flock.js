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

        var dt;
        if (this.lastTime===undefined) {
            dt = 16;
        } else {
            dt = now - this.lastTime;
        }
        this.lastTime = now;

        var x = 0, y = 0, i, dx, dy, d2, n;
        var s = this.sprite;

        var neighbors = this.tracker.find(s.x, s.y, this.flock_neighborhood, true);

        /* TODO: Maintain current direction.
         *
         * TODO: Should phasing alter weights?
         */

        var weightSeparation = 1;
        var weightAlignment  = 1;
        var weightCohesion   = 1.5;
        var weightSteering   = 2;
        var weightInertia    = 1.5;
        var hweightInertia   = weightInertia / 2;

        /* TODO: I have a vague suspicion that not all the vertical components are being
         * halved correctly. */

        /* steering */

        this.flock_steering(s, this.xy);

        this.xy[0] = this.xy[0] * weightSteering;
        this.xy[1] = this.xy[1] * weightSteering;

        /* cohesion: Find average location of neighbours for cohesion vector */

        var count = Math.min(this.flock_neighbor_limit, neighbors.length);
        if (count>0) {
            for (i = count - 1; i >= 0; i--) {
                n = neighbors[i];
                x+=n.x;
                y+=n.y;
            }
            x/=count;
            y/=count;
            s.vectorTo(x, y, this.xy2);
            this.xy[0] = this.xy[0] + weightCohesion * this.xy2[0];
            this.xy[1] = this.xy[1] + weightCohesion * this.xy2[1];
        }

        /* alignment: average vector of neighbours */

        if (count>0) {
            for (x = 0, y = 0, i = count - 1; i >= 0; i--) {
                n = neighbors[i];
                s.vector(this.xy2);
                x+=this.xy2[0];
                y+=this.xy2[1];
            }
            x/=count;
            y/=count;
            this.xy[0] = this.xy[0] + weightAlignment * x/count;
            this.xy[1] = this.xy[1] + weightAlignment * y/count;
        }

        /* separation: Any flockmates that are too close should repel the sprite. */
        count = 0;
        for (x = 0, y = 0, i = 0; i < neighbors.length; i++) {
            n = neighbors[i];
            dx = s.x - n.x;
            dy = s.y - n.y;
            d2 = (dx*dx)+(dy+dy);
            if (d2>this.flock_separation2) {
                break;
            }
            count++;
            var prop = 1-Math.sqrt(d2/this.flock_separation2);
            x+=prop*dx;
            y+=prop*dy;
        }

        if (count>0) {
            x/=count;
            y/=count;
            this.xy[0] = this.xy[0] + weightSeparation*x;
            this.xy[1] = this.xy[1] + weightSeparation*y;
        }

        /* update velocity */

        s.velocityx = weightInertia  * s.velocityx + this.xy[0];
        s.velocityy = hweightInertia * s.velocityy + this.xy[1];

        var maxSpeed = this.flock_speed * dt/1000;
        var mag = (s.velocityx*s.velocityx)+(s.velocityy*s.velocityy);
        if (mag>(maxSpeed*maxSpeed)) {
            mag = Math.sqrt(mag);
            s.velocityx = maxSpeed * s.velocityx/mag;
            s.velocityy = maxSpeed * s.velocityy/mag;
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
