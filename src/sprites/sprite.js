/*global define*/
define(['util/js'], function(js) {

    'use strict';

    var copyProps = js.copyProps;
    var clone = js.clone;

    /** Creates a new sprite object.
     * @param {Object} sn Snaps engine ref
     * @param {Object} def The sprite definition to use
     * @param {Function/Number} x X world position
     * @param {Function/Number} y Y world position
     * @param {Function/Number} h Height from the ground
     * @param {Object} opts Optional configuration options. All properties are optional
     * and is in the following form:
     * {
     *     maxloops: {Function/Number} How many times should the initial state loop
     *               before the sprite is automatically destroyed? Set to 0 or undefined
     *               if it does not automatically expire.
     *     updates: {Array} An array of sprite update plugin instances that will be called
     *              with each update of this sprite.
     *     collider: {object} A collider to test for collisions during movement
     *     endCallback: {Function}An optional function to call when the sprite is destroyed.
     *     autoRemove: {bool} Optional (defaults to true). If set, the sprite will be removed
     *                 from the scene once it expires. If maxloops is set and it is not
     *                 removed, it will remain on the final frame.
     *     quantizedHeight: {bool} Optional (defaults to false). If you move x,y, and h at the
     *                 same time and the movement collides, then h will by default be altered
     *                 by the proportion of the path travelled. If this flag is true, then h will
     *                 be altered entirely, regardless of the collision.
     * }
     *
     * An example of how to pass a random range into any Function/Number parameters would be to bind
     * the rnd function in util/rnd. E.g.
     *
     * var posRange = rnd.bind(rnd,-20,20); // Random range between -20 and 20
     * var fastRand = rnd.fastRand(10,20); // Fast cached random number set
     *
     * new Sprite(sn,def,posRange,posRange,0,{maxloops:fastRand});
     *
     * Alternatively of course, you could provide your own custom parameterless number
     * generator and pass it in.
     */
    function Sprite(sn, def, x, y, h, opts) {
        opts = opts||{};

        this.def = def;
        this.sn = sn;
        this.x = typeof x === 'function'?x():x;
        this.y = typeof y === 'function'?y():y;
        this.h = typeof h === 'function'?h():h;
        this.state = null;
        this.active = true;
        if (opts.maxloops === undefined) {
            this.maxloops = 0;
        } else {
            this.maxloops = typeof opts.maxloops === 'function'?opts.maxloops():opts.maxloops;
        }
        this.updates = opts.updates;
        this.commits = opts.commits;
        this.id = opts.id;

        if (typeof(this.id)==='number') {
            this.nuid = this.id;
            this.id = 'id'+this.id;
        } else {
            this.nuid = sn.util.uid();
        }

        this.endCallback = opts.endCallback;
        this.collider = opts.collider;
        this.autoRemove = opts.autoRemove;
        if (this.autoRemove===undefined) {
            this.autoRemove = true;
        }

        this.collisionPoint = [0,0];

        this.quantizedHeight = !!opts.quantizedHeight;

        this.directionNormalized = false;

        this.vectorx = 0;
        this.vectory = 1;

        this.directionx = x;
        this.directiony = y+1;

        /* Some plugins may manipulate velocity, but it is not directly acted upon by the sprite itself. */
        this.velocityx = 0;
        this.velocityy = 0;
    }

    Sprite.prototype.init = function() {
        var i;

        if (this.updates!==undefined) {
            for (i = 0; i < this.updates.length; i++) {
                var update = this.updates[i];
                update.init(this);
                if (update.hasOwnProperty('phaser')) {
                    update.phaser.addSprite(this);
                }
            }
        }

        if (this.commits!==undefined) {
            for (i = 0; i < this.commits.length; i++) {
                var commit = this.commits[i];
                commit.init(this);
                if (commit.hasOwnProperty('phaser')) {
                    commit.phaser.addSprite(this);
                }
            }
        }
    };

    /** Returns the max duration of the sprite before it automatically expires.
     * This value may change if the state changes. Does not take time already
     * expired into account.
     * @return {Number} The max duration of the current state, or 0 if it will not
     * expire.
     */
    Sprite.prototype.maxDuration = function() {
        if (this.maxloops===0) {
            return 0;
        }
        return this.state.dur * this.maxloops;
    };

    Sprite.prototype.isActive = function(now) {
        if (this.active && this.maxloops>0 && this.state.dur * this.maxloops <= (now - this.epoch)) {
            this.active = false;

            if (this.endCallback!==undefined&&this.autoRemove) {
                this.endCallback();
            }
        }
        return this.active||!this.autoRemove;
    };

    Sprite.prototype.setState = function(state, ext) {

        this.active = true;

        if (this.stateName===state && this.stateExt===ext) {
            return;
        }

        this.stateName = state;
        this.stateExt = ext;

        if (ext!==undefined && this.def.states.hasOwnProperty(state + '_' + ext)) {
            state = state + '_' + ext;
        }

        if (!this.def.states.hasOwnProperty(state)) {
            throw "Bad sprite definition. Missing state: "+state;
        }

        this.state = this.def.states[state];
        this.epoch = this.sn.getNow();
    };

    Sprite.prototype.stateName = function() {
        return this.stateName;
    };

    Sprite.prototype.hasState = function(state) {
        return this.def.states.hasOwnProperty(state);
    };

    Sprite.prototype.morphState = function(state) {
        /* TODO: Make a state transition, but maintain the jog position. Note that the jog position
         * may be clamped to the last frame if autoRemove is false and the internal active flag is set.
         */
    };

    Sprite.prototype.update = function(now) {
        if (this.updates!==undefined) {
            for (var i = 0; i < this.updates.length; i++) {
                var update = this.updates[i];
                if (update.predicate.call(this)) {
                    var phaseOn = update.phaser===undefined?true:update.phaser.phase(this, now);
                    if(!update.update(now, phaseOn)) {
                        /* Return false from an update function to break the chain. */
                        break;
                    }
                }
            }
        }
    };

    Sprite.prototype.commit = function(now) {
        /* TODO: Not sure if it's a bug or a feature, but we can't guarantee that an update and a commit
         * that share the same phaser will share the same phase. We should test for that. */

        /* TODO: Document that a sprite should not be removed from the stage during a commit; only an
         * update. Can we enforce this? */

        if (this.commits!==undefined) {
            for (var i = 0; i < this.commits.length; i++) {
                var commit = this.commits[i];
                if (commit.predicate.call(this)) {
                    var phaseOn = commit.phaser===undefined?true:commit.phaser.phase(this, now);
                    if(!commit.update(now, phaseOn)) {
                        /* Return false from an update function to break the chain. */
                        break;
                    }
                }
            }
        }
    };

    Sprite.prototype.drawAt = function(ctx, screenx, screeny, now) {
        if (!this.active && this.autoRemove) {
            /* This may have been set by prior call to update, so check here */
            return;
        }

        this.state.draw(ctx, screenx, screeny, this.epoch, now, (!this.active && !this.autoRemove));
    };

    /** Move a sprite to a point, taking collision into account.
     * If there is a collision, the sprite will be moved to the point of collision.
     * @param  {Number} tx Target x world position
     * @param  {Number} ty Target y world position
     * @param  {Number} th Optional; Target height
     * @return {Boolean} True if there was a collision.
     */
    Sprite.prototype.moveTo = function(tx,ty,th,collide) {
        if (th!==undefined) {
            th=th-this.h;
        }

        return this.move(tx-this.x,ty-this.y,th, collide);
    };

    /** Move a sprite by a given amount, taking collision into account.
     * If there is a collision, the sprite will be moved to the point of collision.
     * @param  {Number} dx Amount to alter x position
     * @param  {Number} dy Amount to alter y position
     * @param  {Number} dh Optional; Amount to alter height
     * @return {Boolean} True if there was a collision.
     */
    Sprite.prototype.move = function(dx,dy,dh, collide) {

        if (!(dx||dy||dh)) {
            return false;
        }

        collide = collide===undefined?true:collide;

        var collisionRatio;

        if (collide && this.collider!==undefined) {
            collisionRatio = this.collider.test(this.x, this.y, dx,dy,this.h,this.collisionPoint);
            this.x = this.collisionPoint[0];
            this.y = this.collisionPoint[1];
        } else {
            this.x=this.x+dx;
            this.y=this.y+dy;
        }

        this.setDirection(this.x + dx, this.y + dy);

        var collided = collide && collisionRatio<1;

        if (dh!==undefined) {
            if (collided && !this.quantizedHeight) {
                /* If collided, we adjust the height be a proportion of the
                 * requested amount. */
                this.h+=dh*collisionRatio;
                return true;
            } else {
                this.h+=dh;
                return false;
            }
        }

        return collided;

        /* TODO: Technically, if the height is adjusted upwards and we're not quantizing
         * height, then the path should be retraced at the new height to see if it got further,
         * since technically it may have cleared the obstruction at that point.
         *
         * A retrace opportunity can be detected if the height at the collision point is lower than the
         * new height after the collision. Repeat until this is not true, or there is no collision.
         *
         * The collider would need to be rewritten to emit the height at the collision point.
         *
         * do
         * {
         *     trace
         *     adjust height
         *     retrace op?
         * }
         * while(retrace op)
         *
         * finally assign new values to sprite.
         *
         * Not implementing now, because it may be prefered to implement sampling predecates first, which
         * may render this task more difficult.
         *
         * Alternatively, adjust the height as you trace. Actually yeah, that makes way more sense. Wouldn't even
         * need bresenhams, just a linear tween calc.
         *
         * Perhaps this can be called flight mode or something.
         */
    };

    /** Sets the direction of the sprite. This is expressed as a world
     * position to look towards. This is not used in sprite rendering
     * directly, but can be picked up by plugins. Direction is set automatically
     * if the sprite moves, but you can then override direction by calling this.
     * @param {Number} tox World X position to orient towards.
     * @param {Number} toy World Y position to orient towards.
     */
    Sprite.prototype.setDirection = function(tox, toy) {
        this.directionx = tox;
        this.directiony = toy;
        this.directionNormalized = false;
    };

    /** Calculates the normalized vector of the sprite's direction.
     * @param {Number} out An 2-length array that will recieve the xy values of
     * the vector in that order.
     */
    Sprite.prototype.vector = function(out) {
        if (!this.directionNormalized) {
            this.directionNormalized = true;
            var dx = this.directionx - this.x;
            var dy = this.directiony - this.y;
            if (dx===0&&dy===0) {
                this.vectorx = 0;
                this.vectory = 0;
            } else {
                var mag = Math.sqrt((dx*dx)+(dy*dy));
                this.vectorx = dx/mag;
                this.vectory = dy/mag;
            }
        }
        out[0] = this.vectorx;
        out[1] = this.vectory;
    };

    Sprite.prototype.vectorTo = function(x, y, out) {
        var dx = x - this.x;
        var dy = y - this.y;
        if (dx===0&&dy===0) {
            out[0] = 0;
            out[1] = 0;
        } else {
            var mag = Math.sqrt((dx*dx)+(dy*dy));
            out[0] = dx/mag;
            out[1] = dy/mag;
        }
    };

    Sprite.prototype.draw = function(ctx, offsetx, offsety, now) {
        this.drawAt(
                ctx,
                (this.x - offsetx - this.def.x)|0,
                (this.y - offsety - this.def.y - this.h)|0,
                now);
    };

    Sprite.prototype.onRemove = function() {
        if (this.updates!==undefined) {
            for (var i = 0; i < this.updates.length; i++) {
                var update = this.updates[i];
                if(update.phaser!==undefined) {
                    update.phaser.removeSprite(this);
                }
                update.onSpriteRemoved();
            }
        }
    };

    var troo = function() {
        return true;
    };

    /** See snaps.spawnSprite for parameter descriptions.
     */
    Sprite.construct = function(sn, defName, stateName, stateExt, x, y, h, opts) {

        var i;

        if(!sn.spriteDefs.hasOwnProperty(defName)) {
            throw "Error: Missing sprite definition when spawning sprite " + defName;
        }

        var sd = sn.spriteDefs[defName];

        /* TODO: Document predicate types. String matches state. Array of strings matches multiple states.
         * Or custom function is called with sprite as 'this'. Defaults to 'true'. */
        var createPredicate = function(optUpdate) {
            var t = typeof(optUpdate.predicate);
            var i;

            if (t==='string') {
                var pval = optUpdate.predicate;
                /* TODO: Test this predicate type */
                return function() {
                    return s.stateName===pval;
                };
            } else if (t==='object') {
                /* Assume an array of strings */
                var pvals = {};

                for (i = optUpdate.predicate.length - 1; i >= 0; i--) {
                    pvals[optUpdate.predicate[i]] = true;
                }


                /* TODO: Test this predicate type */
                return function() {
                    return pvals.hasOwnProperty(s.stateName);
                };
            } else if (t==='function') {
                /* TODO: Test this predicate type */
                return optUpdate.predicate;
            } else {
                return troo;
            }
        };

        /* TODO: The two following loops are very similar. Refactor them and inline the createPredicate part. */

        var updates = opts.updates;
        if (updates !== undefined) {
            updates = new Array(opts.updates.length);
            for (i = 0; i < opts.updates.length; i++) {
                var optUpdate = opts.updates[i];
                var suname = optUpdate.name;
                if (!sn.spriteUpdaters.hasOwnProperty(suname)) {
                    throw "Sprite update plugin used in update but not registered: "+suname;
                }
                updates[i] = new sn.spriteUpdaters[suname]();
                copyProps(optUpdate, updates[i]);
                updates[i].predicate = createPredicate(optUpdate);
            }
        }

        var commits = opts.commits;
        if (commits !== undefined) {
            commits = new Array(opts.commits.length);
            for (i = 0; i < opts.commits.length; i++) {
                var optCommit = opts.commits[i];
                var scname = optCommit.name;
                if (!sn.spriteUpdaters.hasOwnProperty(scname)) {
                    throw "Sprite update plugin used in commit but not registered: "+scname;
                }
                commits[i] = new sn.spriteUpdaters[scname]();
                copyProps(optCommit, commits[i]);
                commits[i].predicate = createPredicate(optCommit);
            }
        }

        opts = clone(opts);
        opts.updates = updates;
        opts.commits = commits;

        var s = new Sprite(sn, sd, x, y, h, opts);
        s.setState(stateName, stateExt);

        if (opts.opts !== undefined) {
            for(var opt in opts.opts) {
                s[opt]=opts.opts[opt];
            }
        }

        s.init();

        return s;
    };

    return Sprite;

});
