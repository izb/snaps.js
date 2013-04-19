/*global define*/
define(function() {

    'use strict';

    var sn;

    /*
     * The track plugin will call a callback function only whenever a
     * sprite's position changes.
     *
     * Example options:
     *
     * var tracker = new _this.sn.ProximityTracker(100);
     *
     * updates:[{
     *     name:'flock',
     *     tracker: tracker,
     *     flock_speed: 120,
     *     flock_neighborhood: 50,
     *     flock_separation: 20,
     *     flock_neighbor_limit: 5,
     *     flock_steering: function(s, out) {
     *         out[0]=1;
     *         out[1]=0;
     *     }
     * }]
     *
     * flock_speed is in pixels/second. Initial sprite orientation should be set on the
     * sprite with setDirection.
     *
     * flock_neighborhood is in pixels and defines the radius that defines the influential
     * flockmates. Larger is generally better but slower, dependant on the tracker.
     *
     * flock_neighbor_limit is the number of neighbors that will contribute to the influence.
     * E.g. if set to 5, only the 5 closest flockmates will influence the sprite. Larger is
     * better, but slower. Set to a very large number to include all flockmates in the
     * neighborhood.
     *
     * flock_steering is a function that should provide a normalized vector determining the general
     * direction for a particular sprite.
     *
     * Sprites that flock with the same tracker will belong to the same flock.
     *
     * This plugin supports phasers and will flock more efficiently, but with less
     * accuracy with phased updates.
     *
     * Note that this plugin will not move the sprites, it only calculates velocity. To move the
     * sprites you should add the apply-velocity plugin after this one.
     *
     */

    function Flock() {
        this.xy=[0,0];
        this.xy2=[0,0];
    }

    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @param  {Number} now The time of the current frame
     * @param  {Bool} phaseOn If the update is controlled by a phaser,
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

        var weightSeparation = 2;
        var weightAlignment = 1;
        var weightCohesion = 1.8;
        var weightSteering = 0.5;
        var weightInertia =1.5;
        var hweightInertia =weightInertia/2;

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
            x+=n.x; /* TODO: Normalize and weight by distance */
            y+=n.y;
        }

        if (count>0) {
            x/=count;
            y/=count;
            s.vectorTo(x, y, this.xy2);
            this.xy[0] = this.xy[0] - weightSeparation*this.xy2[0];
            this.xy[1] = this.xy[1] - weightSeparation*this.xy2[1];
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

    Flock.prototype.onSpriteRemoved = function() {
    };

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
