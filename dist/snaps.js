
/*global define*/
define('sprites/spritedef',[],function() {

    

    /**
     * @module sprites/spritedef
     * @private
     */

    /**
     * @private
     * @constructor module:sprites/spritedef.State
     * @param {Array} seq Image offset sequence in the form
     * [[x0,y0],[x1,y1],[x2,y2]...]
     */
    function State(seq, dur, def) {
        this.seq = seq;
        this.dur = dur;
        this.def = def;
    }

    /**
     * @method module:sprites/spritedef.State#jogPos
     * @private
     */
    State.prototype.jogPos = function(epoch, now) {
        var dt = now - epoch;
        dt = dt % this.dur;
        return dt / this.dur;
    };

    /**
     * @method module:sprites/spritedef.State#draw
     * @private
     */
    State.prototype.draw = function(ctx, x, y, epoch, now, forceFinal) {
        var def = this.def;
        var pos = this.seq[
            forceFinal?
                this.seq.length-1
              : Math.floor(this.seq.length * this.jogPos(epoch, now))];

        ctx.drawImage(
                /* src */
                def.image,
                pos[0], pos[1],
                def.w, def.h,
                /*dest*/
                x, y,
                def.w, def.h
            );
    };

    /**
     * @private
     * @constructor module:sprites/spritedef.SpriteDef
     */
    function SpriteDef(image, w, h, x, y) {
        this.states = {};
        this.image = image;
        this.w = w;
        this.h = h;

        /*hotspot...*/
        this.x = x;
        this.y = y;
    }

    /**
     * @private
     * @method module:sprites/spritedef.SpriteDef#addState
     */
    SpriteDef.prototype.addState = function(name, seq, dur) {
        var pos = [];
        var xmax = Math.floor(this.image.width / this.w);

        for (var i = 0; i < seq.length; i++) {
            var idx = seq[i];
            var x = this.w * (idx % xmax);
            var y = this.h * Math.floor(idx / xmax);
            pos.push([x,y]);
        }
        this.states[name] = new State(pos, dur, this);
    };

    /**
     * @private
     * @method module:sprites/spritedef.SpriteDef#aliasState
     */
    SpriteDef.prototype.aliasState = function(alias, state) {
        var s = this.states[state];
        /* TODO: Validate */
        this.states[alias] = s;
    };

    return SpriteDef;

});

/*global define*/
define('util/js',[],function() {

    

    /**
     * @module util/js
     */

    /** Convert a click event position (event.pageX/Y) into coords relative
     * to a canvas.
     * @private
     */
    HTMLCanvasElement.prototype.relCoords = function(x,y,out){

        /* TODO: Doesn't the mouse handler do this too? Consolidate this code. */
        var rect = this.getBoundingClientRect();
        out[0] = x - rect.left - window.pageXOffset;
        out[1] = y - rect.top - window.pageYOffset;
    };

    return {

        /**
         * Copy properties from one object to another
         * @function module:util/js#copyProps
         * @param {Object} s The source object
         * @param {Object} d The destination object
         * @return {Object} The destination object
         */
        copyProps: function(s,d) {
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        },

        /**
         * Create a shallow clone of an object
         * @function module:util/js#clone
         * @param {Object} s The source object
         * @return {Object} A new copy of the object
         */
        clone: function(s) {
            var d = {};
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        }

    };

});

/*global define*/
define('sprites/sprite',['util/js'], function(js) {

    /**
     * @module sprites/sprite
     */

    

    var copyProps = js.copyProps;
    var clone = js.clone;

    /** Creates a new sprite object. Note that you shouldn't normally call this constructor directly.
     * Call the factory method {@link module:snaps.Snaps#spawnSprite|spawnSprite} instead.
     * <p>
     * Some parameters or options accept functions. An example of how to pass a random range into any
     * Function/Number parameters would be to bind the rnd function in util/rnd. E.g.
     *
     * <pre>
     * // Random range between -20 and 20:
     * var posRange = rnd.bind(rnd,-20,20);
     * // Fast cached random number set
     * var fastRand = rnd.fastRand(10,20);
     *
     * new Sprite(sn,def,
     *     posRange,posRange,
     *     0,
     *     {maxloops:fastRand});
     * </pre>
     *
     * Alternatively of course, you could provide your own custom parameterless number
     * generator and pass it in.
     * @constructor module:sprites/sprite.Sprite
     * @param {Object} sn Snaps engine ref
     * @param {Object} def The sprite definition to use
     * @param {Number} x X world position. You may also pass a parameterless function that returns
     * a number.
     * @param {Number} y Y world position. You may also pass a parameterless function that returns
     * a number.
     * @param {Number} h Height from the ground. You may also pass a parameterless function that returns
     * a number.
     * @param {Object} [opts] Optional configuration options. All properties are optional.
     * <dl>
     *  <dt>id</dt><dd>If you want to be able to find your sprite again</dd>
     *  <dt>maxloops</dt><dd>How many times should the initial state loop
     *    before the sprite is automatically destroyed? Set to 0 or undefined
     *    if it does not automatically expire. Can also be a parameterless function that returns a number.</dd>
     *  <dt>autoRemove</dt><dd>Defaults to true. If set, the sprite will be removed
     *    from the scene once it expires. If maxloops is set and it is not
     *    removed, it will remain on the final frame.</dd>
     *  <dt>updates</dt><dd>An array of sprite update plugin instances that will be called
     *    with each update of this sprite.</dd>
     *  <dt>commits</dt><dd>An array of sprite update plugin instances that will be called
     *    after all the 'updates' updates are called on each sprite. Think of it as a second phase of
     *    updates.</dd>
     *  <dt>collider</dt><dd>A collider to test for collisions during movement</dd>
     *  <dt>endCallback</dt><dd>An optional function to call when the sprite is destroyed, i.e. removed from the stage</dd>
     *  <dt>quantizedHeight</dt><dd>Defaults to false. If you move x,y, and h at the
     *    same time and the movement collides, then h will by default be altered
     *    by the proportion of the path travelled. If this flag is true, then h will
     *    be altered entirely, regardless of the collision.</dd>
     * </dl>
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

    /**
     * Initialize the sprite before use.
     * @method module:sprites/sprite.Sprite#init
     * @private
     */
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
     * @method module:sprites/sprite.Sprite#maxDuration
     * @return {Number} The max duration of the current state, or 0 if it will not
     * expire.
     */
    Sprite.prototype.maxDuration = function() {
        if (this.maxloops===0) {
            return 0;
        }
        return this.state.dur * this.maxloops;
    };

    /** Tests to see if this is an active sprite. Inactive sprites will be destroyed by the
     * engine.
     * @method module:sprites/sprite.Sprite#isActive
     * @param {Number} now Current frame timestamp
     * @return {Boolean} True if active
     */
    Sprite.prototype.isActive = function(now) {
        if (this.active && this.maxloops>0 && this.state.dur * this.maxloops <= (now - this.epoch)) {
            this.active = false;

            if (this.endCallback!==undefined&&this.autoRemove) {
                this.endCallback();
            }
        }
        return this.active||!this.autoRemove;
    };

    /** Changes the state and extension of this sprite. States in sprite definitions are in the form
     * 'running_ne' where 'running' is the state and 'ne' is the extension.
     * See morphState for an alternative option.
     * @method module:sprites/sprite.Sprite#setState
     * @param {String} state The state of the sprite as specified in its sprite
     * definition.
     * @param {String} ext   The state extension to set, or undefined.
     */
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

    /** Finds the current state name, i.e. the state without the extension.
     * @method module:sprites/sprite.Sprite#stateName
     * @return {String} The state name
     */
    Sprite.prototype.stateName = function() {
        return this.stateName;
    };

    /** Determines whether this sprite has the given fully-qualified (i.e. including
     * extension) state name.
     * @method module:sprites/sprite.Sprite#hasState
     * @param {String} state The state of the sprite as specified in its sprite
     * definition.
     * @return {Boolean} True if it does
     */
    Sprite.prototype.hasState = function(state) {
        return this.def.states.hasOwnProperty(state);
    };

    /** Changes the state and extension of this sprite. States in sprite definitions are in the form
     * 'running_ne' where 'running' is the state and 'ne' is the extension.
     * <p>
     * This method differs from setState in that it maintains the animation jog position of the state,
     * e.g. if the sprite was halfway through its running animation in 'running_ne' and you called this
     * method to change to 'running_e' then the animation would start halfway through its new state.
     * <p>
     * If you had called setState then the new state's animation would have started from the beginning.
     * @method module:sprites/sprite.Sprite#setState
     * @param {String} state The state of the sprite as specified in its sprite
     * definition.
     * @param {String} ext   The state extension to set, or undefined.
     */
    Sprite.prototype.morphState = function(state, ext) {
        /* TODO: Make a state transition, but maintain the jog position. Note that the jog position
         * may be clamped to the last frame if autoRemove is false and the internal active flag is set.
         */
    };

    /**
     * @private
     * @method module:sprites/sprite.Sprite#update
     */
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

    /**
     * @private
     * @method module:sprites/sprite.Sprite#commit
     */
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

    /**
     * @private
     * @method module:sprites/sprite.Sprite#drawAt
     */
    Sprite.prototype.drawAt = function(ctx, screenx, screeny, now) {
        if (!this.active && this.autoRemove) {
            /* This may have been set by prior call to update, so check here */
            return;
        }

        this.state.draw(ctx, screenx, screeny, this.epoch, now, (!this.active && !this.autoRemove));
    };

    /** Move a sprite to a point, taking collision into account.
     * If there is a collision, the sprite will be moved to the point of collision.
     * @method module:sprites/sprite.Sprite#moveTo
     * @param  {Number} tx Target x world position
     * @param  {Number} ty Target y world position
     * @param  {Number} [th] Target height
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
     * @method module:sprites/sprite.Sprite#move
     * @param  {Number} dx Amount to alter x position
     * @param  {Number} dy Amount to alter y position
     * @param  {Number} [dh] Amount to alter height
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
     * @method module:sprites/sprite.Sprite#setDirection
     * @param {Number} tox World X position to orient towards.
     * @param {Number} toy World Y position to orient towards.
     */
    Sprite.prototype.setDirection = function(tox, toy) {
        this.directionx = tox;
        this.directiony = toy;
        this.directionNormalized = false;
    };

    /** Calculates the normalized vector of the sprite's direction.
     * @method module:sprites/sprite.Sprite#vector
     * @param {Array} out An 2-length array that will recieve the xy values of
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

    /** Calculates a normalized vector between the sprite and a given point.
     * @method module:sprites/sprite.Sprite#vector
     * @param {Number} x The X world position of the test point.
     * @param {Number} y The Y world position of the test point.
     * @param {Array} out An 2-length array that will recieve the xy values of
     * the vector in that order.
     */
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

    /**
     * @private
     * @method module:sprites/sprite.Sprite#draw
     */
    Sprite.prototype.draw = function(ctx, offsetx, offsety, now) {
        this.drawAt(
                ctx,
                (this.x - offsetx - this.def.x)|0,
                (this.y - offsety - this.def.y - this.h)|0,
                now);
    };

    /**
     * Called when the sprite is removed from the stage.
     * @private
     * @method module:sprites/sprite.Sprite#onRemove
     */
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

    /**
     * Default function for predicates.
     * @private
     * @method module:sprites/sprite.Sprite#troo
     */
    var troo = function() {
        return true;
    };

    /**
     * See snaps.spawnSprite for parameter descriptions.
     * @private
     * @method module:sprites/sprite.Sprite#troo
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
                return function() {
                    return s.stateName===pval;
                };
            } else if (t==='object') {
                /* Assume an array of strings */
                var pvals = {};

                for (i = optUpdate.predicate.length - 1; i >= 0; i--) {
                    pvals[optUpdate.predicate[i]] = true;
                }

                return function() {
                    return pvals.hasOwnProperty(s.stateName);
                };
            } else if (t==='function') {
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
                    throw "Sprite plugin not registered: "+suname;
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
                    throw "Sprite plugin not registered: "+scname;
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

/*global define*/
define('sprites/composite',['util/js', 'sprites/sprite'], function(js, Sprite) {

    

    /**
     * @module sprites/composite
     */

    var copyProps = js.copyProps;
    var clone = js.clone;


    /**
     * Construct a composite sprite. Do not call this constructor directly; you should instead call
     * <code>sn.createComposite()</code> on the engine.
     * <p>
     * A composite is a collection of sprites that can be manipulated as one. They share the same plane
     * which means they are more efficient. A composite has x, y, but no h position, but the sprites within
     * it behave as though they have x and h but no y position (y is ignored within a composite).
     * @constructor module:sprites/composite.Composite
     * @param {Object} sn The engine reference
     * @param {Number} x X position in the world for the composite.
     * @param {Number} y Y position in the world for the composite.
     * @param {String} id A unique identifier.
     * @param {Function} [endCallback] Once the composite and all its child sprites expire, this is called.
     */
    function Composite(sn, x, y, id, endCallback) {
        /* TODO: Passing an ID in here is smelly. I think. Or perhaps it's ok coz it requires
         * a factory method to call this. I dunno. */
        this.sn = sn;
        this.x = x;
        this.y = y;
        this.endCallback = endCallback;
        this.active = true;
        this.sprites = [];
    }

    /**
     * Initialize the composite before use.
     * @method module:sprites/composite.Composite#init
     * @private
     */
    Composite.prototype.init = function() {
        /* TODO: Initialize composite plugins */
    };


    /**
     * Add a sprite to the composite.
     * @method module:sprites/composite.Composite#addSprite
     * @param defName The name of the sprite definition to use. These are
     * set up in your game's spriteDefs data.
     * @param stateName The initial state. This too is defined in the
     * sprite's definition, in your game's spriteDefs data.
     * @param {Number} x The world x coordinate. If a function, it should take
     * no parameters and return a number.
     * @param {Number} y The world y coordinate. If a function, it should take
     * no parameters and return a number.
     * @param {Number} h The height off the ground. If a function, it should take
     * no parameters and return a number.
     * @param {Object} [opts] For a list of parameters
     * see the opts parameter on the {@link module:sprites/sprite.Sprite|Sprite class constructor}.
     */
    Composite.prototype.addSprite = function(defName, stateName, x, y, h, opts) {

        if (opts===undefined) {
            opts = {};
        }

        var sd = this.sn.spriteDefs[defName];

        /* TODO: Some of this code is shared in snaps.js - refactor */
        var updates = opts.updates;
        if (updates !== undefined) {
            updates = new Array(opts.updates.length);
            for (var i = 0; i < opts.updates.length; i++) {
                updates[i] = new this.sn.spriteUpdaters[opts.updates[i].name]();
                copyProps(opts.updates[i], updates[i]);
            }
        }

        opts = clone(opts);
        opts.updates = updates;

        var s = new Sprite(this.sn, sd, x, y, h, opts);
        s.setState(stateName);

        if (opts.opts !== undefined) {
            for(var opt in opts.opts) {
                s[opt]=opts.opts[opt];
            }
        }

        s.init();

        this.sprites.push(s);

        return s;
    };

    /** Tests to see if this is an active composite. Inactive composites will be destroyed by the
     * engine. If any child sprites are active, this will be active.
     * @method module:sprites/composite.Composite#isActive
     * @param {Number} now Current frame timestamp
     * @return {Boolean} True if active
     */
    Composite.prototype.isActive = function(now) {

        if (!this.active) {
            return false;
        }

        var isactive = false;

        for (var i = this.sprites.length - 1; i >= 0; i--) {
            var s = this.sprites[i];
            if (s.isActive(now)) {
                isactive = true;
            } else {
                this.sprites.splice(i,1);
            }
        }

        this.active = isactive;

        if (!this.active && this.endCallback !== undefined) {
            this.endCallback();
        }

        return isactive;
    };

    /**
     * @private
     * @method module:sprites/composite.Composite#update
     */
    Composite.prototype.update = function(now, fnEach) {
        /* TODO: Call composite plugins */
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            if (fnEach!==undefined) {
                fnEach(this.sprites[i], now);
            }
            this.sprites[i].update();
        }
    };

    /**
     * @private
     * @method module:sprites/composite.Composite#draw
     */
    Composite.prototype.draw = function(ctx, screenx, screeny, now) {
        if (!this.active) {
            /* This may have been set by prior call to update, so check here */
            return;
        }

        /* Composite's position. */
        var x = this.x - screenx;
        var y = this.y - screeny;

        for (var i = 0; i < this.sprites.length; i++) {
            var s = this.sprites[i];

            /* For sprites in a composite, the x/y position is relative to the
             * composite screen position. The height is ignored. */
            if (s.isActive(now)) {
                s.drawAt(ctx, x+s.x-s.def.y, y+s.y-s.h-s.def.y, now);
            }
        }
    };

    /**
     * @private
     * @method module:sprites/composite.Composite#onRemove
     */
    Composite.prototype.onRemove = function() {
        for (var i = this.sprites.length - 1; i >= 0; i--) {
            this.sprites[i].onRemove();
        }
    };

    return Composite;

});

/*global define*/
define('input/keyboard',[],function() {

    /**
     * @module input/keyboard
     */

    

    /** Creates a keyboard input handler and starts listening for
     * keyboard events. You don't normally need to create this since the engine
     * creates one by default.
     * @constructor module:input/keyboard.Keyboard
     */
    function Keyboard() {

        var _this = this;

        /**
         * A map of keycodes that you can use to set up keybindings.
         * @member module:input/keyboard.Keyboard#keymap
         */
        this.keymap = {
            backspace: 8,
            tab: 9,
            enter: 13,
            pause: 19,
            capsLock: 20,
            escape: 27,
            space: 32,
            pageUp: 33,
            pageDown: 34,
            end: 35,
            home: 36,
            left: 37,
            up: 38,
            right: 39,
            down: 40,
            ins: 45,
            del: 46,

            /* Main keyboard */
            plus: 187,
            comma: 188,
            minus: 189,
            period: 190,

            shift: 16,
            ctrl: 17,
            alt: 18,

            /* top row */
            zero: 48,
            one: 49,
            two: 50,
            three: 51,
            four: 52,
            five: 53,
            six: 54,
            seven: 55,
            eight: 56,
            nine: 57,

            a: 65,
            b: 66,
            c: 67,
            d: 68,
            e: 69,
            f: 70,
            g: 71,
            h: 72,
            i: 73,
            j: 74,
            k: 75,
            l: 76,
            m: 77,
            n: 78,
            o: 79,
            p: 80,
            q: 81,
            r: 82,
            s: 83,
            t: 84,
            u: 85,
            v: 86,
            w: 87,
            x: 88,
            y: 89,
            z: 90,

            /* Number pad */
            num0: 96,
            num1: 97,
            num2: 98,
            num3: 99,
            num4: 100,
            num5: 101,
            num6: 102,
            num7: 103,
            num8: 104,
            num9: 105,

            /* More number pad */
            multiply: 106,
            add: 107,
            substract: 109,
            decimal: 110,
            divide: 111,

            /* Function keys */
            F1: 112,
            F2: 113,
            F3: 114,
            F4: 115,
            F5: 116,
            F6: 117,
            F7: 118,
            F8: 119,
            F9: 120,
            F10: 121,
            F11: 122,
            F12: 123
        };

        this.actions = [];
        this.keys = [];

        /* TODO: bind is reserved. Probably want to rename this. */

        /**
         * Binds a key to an action.
         * @method module:input/keyboard.Keyboard#bind
         * @param  {Number} key    A keycode from {@link module:input/keyboard.Keyboard#keymap|keymap}
         * @param  {String} action An arbitrary action you want to bind to the key.
         */
        this.bind = function(key, action) {
            _this.actions[action] = 0;
            _this.keys[_this.keymap[key]] = action;
        };

        var keydown = function(e) {
            var tag = e.target.tagName;
            if (e.type !== 'keydown' || tag === 'INPUT' || tag === 'TEXTAREA')
            {
                return;
            }
            e.preventDefault();

            var keycode = e.keyCode;
            var action = _this.keys[keycode];
            if (action) {
                _this.actions[action] = keycode;
            }
        };

        var keyup = function(e) {
            if (e.type !== 'keyup')
            {
                return;
            }
            e.preventDefault();

            var keycode = e.keyCode;
            var action = _this.keys[keycode];
            if (action) {
                _this.actions[action] = 0;
            }
        };

        /**
         * Tests to see if any actions were pressed since the last check.
         * @method module:input/keyboard.Keyboard#actionPressed
         * @param  {String} action The action to test, previously set up with
         * {@link module:input/keyboard.Keyboard#bind|bind}
         * @return {Boolean} true if the action was pressed.
         */
        this.actionPressed = function(action) {
            return !!_this.actions[action];
        };

        window.addEventListener('keydown', keydown, false);
        window.addEventListener('keyup', keyup, false);
    }

    return Keyboard;

});

/*global define*/
define('input/mouse',[],function() {

    /**
     * @module input/mouse
     */

    

    /** Creates a mouse input handler and starts listening for
     * mouse events. You don't normally need to create this since the engine
     * creates one by default.
     * @constructor module:input/mouse.Mouse
     * @param {HTMLCanvasElement} canvas Mouse position will be
     * relative to and constrained to the limits of the given canvas.
     */
    function Mouse(canvas) {

        var _this = this;

        /**
         * The mouse X position, relative to the left-hand-edge of the canvas.
         * @type {Number}
         * @member module:input/mouse.Mouse#x
         */
        this.x = 0;

        /**
         * The mouse Y position, relative to the top of the canvas.
         * @type {Number}
         * @member module:input/mouse.Mouse#y
         */
        this.y = 0;

        this.inputmap = {
            mouse1: -1,
            mouse2: -3,
            wheelUp: -4,
            wheelDown: -5
        };

        var mousemoved = function(e) {
            var rect = canvas.getBoundingClientRect();
            _this.x = e.clientX - rect.left;
            _this.y = e.clientY - rect.top;
        };

        canvas.addEventListener('mousemove', mousemoved, false);

    }

    return Mouse;

});

/*global define*/
define('util/preload',[],function() {

    

    /**
     * @module util/preload
     */

     /**
      * Create a preloader for fetching multiple image files.
      * @constructor module:util/preload.Preloader
      */
    function Preloader() {
        this.batch = [];
        this.errorstate = false;
    }

    /**
     * Initialize the composite before use.
     * @method module:util/preload.Preloader#add
     * @param {String} file The file to load
     * @param {String} tag Some tag to help you identify the image when it's loaded
     * @param {Function} [fnStore] A callback to receive the loaded image, in the form
     * <pre>
     * function(image, tag) {
     * }
     * </pre>
     * Where the image is a loaded Image object.
     */
    Preloader.prototype.add = function(file, tag, fnStore) {
        this.batch.push({file:file, tag:tag, fnStore:fnStore});
    };

    /**
     * Start the preloader
     * @method module:util/preload.Preloader#load
     * @param  {Function} fnComplete Callback when all files are loaded.
     * @param  {Function} fnProgress Called periodically with progress expressed
     * as a number between 0 and 1.
     * @param  {Function} fnError Called on each load error.
     */
    Preloader.prototype.load = function(fnComplete, fnProgress, fnError) {

        var count = this.batch.length;
        var _this = this;

        fnProgress(0);

        function loadHandler(item, img) {
            return function() {
                if (_this.errorstate) {
                    return;
                }
                count--;
                if (item.fnStore!==undefined) {
                    item.fnStore(img, item.tag);
                }
                fnProgress(1-count/_this.batch.length);
                if (count===0) {
                    fnComplete();
                }
            };
        }

        function error(e) {
            if (!_this.errorstate) {
                _this.errorstate = true;
                fnError();
            }
        }

        for (var i = 0; i < this.batch.length; i++) {
            var next = this.batch[i];

            var img = new Image();
            img.onload = loadHandler(next, img);
            img.onerror = error;
            img.src = next.file;
        }

    };

    return Preloader;

});

/*global define*/
define('util/rnd',[],function() {

    

    /**
     * @module util/rnd
     */

    /** Return a random integer.
     * @function module:util/rnd#rnd
     * @param min Lowest possible value
     * @param max Highest possible value
     */
    var rnd = function(min,max) {
        return min+Math.random()*(max-min+1)|0;
    };

    /** Return a random float.
     * @function module:util/rnd#rndFloat
     * @param min Lowest possible value
     * @param max Highest possible value
     */
    var rndFloat = function(min,max) {
        return min+Math.random()*(max-min+1);
    };

    var genRands = function(min, max, setsize, fn) {
        var lut = [];
        setsize = setsize||10000;
        for (var i=setsize; i>0; i--) {
            lut.push(fn(min, max));
        }

        var pos = 0;

        return function() {
            pos++;
            if (pos===lut.length) {
                pos = 0;
            }
            return lut[pos];
        };
    };

    return {

        rnd: rnd,

        rndFloat: rndFloat,

        /** Generates a function that returns a faster random integer
         * generator, but which has a setup cost. If you're generating a very large
         * number of random numbers, this is significantly faster.
         * <p>
         * See {@link http://jsperf.com/precalc-random-numbers|jsperf.com}
         * <p>
         * e.g.
         * <pre>
         * // This bit is slow
         * var nextRand = rnd.fastRand(1, 10);
         * // This bit is fast
         * var n = nextRand();
         * <pre>
         * @function module:util/rnd#fastRand
         * @param {Number} min Lowest possible value
         * @param {Number} max Highest possible value
         * @param {Number} setsize Optional. The number of values to
         * precalculate.
         */
        fastRand: function(min, max, setsize) {
            return genRands(min, max, setsize, rnd);
        },

        /** Generates a function that returns a faster random float
         * generator, but which has a setup cost. If you're generating a very large
         * number of random numbers, this is significantly faster.
         * <p>
         * See {@link http://jsperf.com/precalc-random-numbers|jsperf.com}
         * <p>
         * e.g.
         * <pre>
         * // This bit is slow
         * var nextRand = rnd.fastRandFloat(0, 1);
         * // This bit is fast
         * var n = nextRand();
         * <pre>
         * @function module:util/rnd#fastRandFloat
         * @param {Number} min Lowest possible value
         * @param {Number} max Highest possible value
         * @param {Number} setsize Optional. The number of values to
         * precalculate.
         */
        fastRandFloat: function(min, max,setsize) {
            return genRands(min, max, setsize, rndFloat);
        }

    };

});

/*global define*/
define('util/bitmap',[],function() {

    

    /**
     * @module util/bitmap
     */
    return {

        /**
         * Extract the red channel from an image into an array.
         * @function module:util/bitmap#imageToRData
         * @param {DOMElement} image The source image
         * @return {Array} An array of byte values as a regular array
         */
        imageToRData: function(image)
        {
            var w = image.width;
            var h = image.height;

            var canvas = document.createElement('canvas');
            canvas.height = h;
            canvas.width = w;
            var ctx = canvas.getContext('2d');

            ctx.drawImage(image, 0, 0);

            var rgba = ctx.getImageData(0,0,w,h).data;

            var r = new Array(rgba.length/4);

            for (var i = 0; i < r.length; i++) {
                r[i] = rgba[i*4];
            }

            return r;
        }
    };

});

/*global define*/
define('util/debug',[],function() {

    

    /**
     * @module util/debug
     * @private
     */
    return {

        debugText: function(ctx, text, x, y) {
            ctx.fillStyle = "black";
            ctx.font = "bold 16px Arial";
            ctx.fillText(text,x+1, y);
            ctx.fillText(text,x-1, y);
            ctx.fillText(text,x, y+1);
            ctx.fillText(text,x, y-1);
            ctx.fillStyle = "white";
            ctx.fillText(text,x, y);
        }

    };

});

/*global define*/
define('util/minheap',[],function() {

    

    /**
     * @module util/minheap
     */

    /**
     * Implementation of a min heap.
     * <p>
     * See {@link http://www.digitaltsunami.net/projects/javascript/minheap/index.html|digitaltsunami.net}
     * <p>
     * Modified to expect only to contain objects that expose a 'score'
     * value for comparison.
     * @constructor module:util/minheap.MinHeap
     */
    function MinHeap() {

        this.heap = [];

        /**
         * Retrieve the index of the left child of the node at index i.
         * @method module:util/minheap.MinHeap#left
         * @private
         */
        this.left = function(i) {
            return 2 * i + 1;
        };

        /**
         * Retrieve the index of the right child of the node at index i.
         * @method module:util/minheap.MinHeap#right
         * @private
         */
        this.right = function(i) {
            return 2 * i + 2;
        };

        /**
         * Retrieve the index of the parent of the node at index i.
         * @method module:util/minheap.MinHeap#parent
         * @private
         */
        this.parent = function(i) {
            return Math.ceil(i / 2) - 1;
        };

        /**
         * Ensure that the contents of the heap don't violate the
         * constraint.
         * @method module:util/minheap.MinHeap#heapify
         * @private
         */
        this.heapify = function(i) {
            var lIdx = this.left(i);
            var rIdx = this.right(i);
            var smallest;
            if (lIdx < this.heap.length && (this.heap[lIdx].score < this.heap[i].score)) {
                smallest = lIdx;
            } else {
                smallest = i;
            }
            if (rIdx < this.heap.length && (this.heap[rIdx].score < this.heap[smallest].score)) {
                smallest = rIdx;
            }
            if (i !== smallest) {
                var temp = this.heap[smallest];
                this.heap[smallest] = this.heap[i];
                this.heap[i] = temp;
                this.heapify(smallest);
            }
        };

        /**
         * Starting with the node at index i, move up the heap until parent value
         * is less than the node.
         * @method module:util/minheap.MinHeap#siftUp
         * @private
         */
        this.siftUp = function(i) {
            var p = this.parent(i);
            if (p >= 0 && (this.heap[p].score > this.heap[i].score)) {
                var temp = this.heap[p];
                this.heap[p] = this.heap[i];
                this.heap[i] = temp;
                this.siftUp(p);
            }
        };
    }

    /**
     * Place an item in the heap.
     * @method module:util/minheap.MinHeap#push
     * @param {Object} item An item that exposes a 'score' property
     */
    MinHeap.prototype.push = function(item) {
        this.heap.push(item);
        this.siftUp(this.heap.length - 1);
    };

    /**
     * Pop the minimum valued item off of the heap. The heap is then updated
     * to float the next smallest item to the top of the heap.
     * @method module:util/minheap.MinHeap#pop
     * @returns {Object} the minimum scored object contained within the heap.
     */
    MinHeap.prototype.pop = function() {
        var value;
        if (this.heap.length > 1) {
            value = this.heap[0];
            // Put the bottom element at the top and let it drift down.
            this.heap[0] = this.heap.pop();
            this.heapify(0);
        } else {
            value = this.heap.pop();
        }
        return value;
    };


    /**
     * Returns the minimum value contained within the heap.  This will
     * not remove the value from the heap.
     * @method module:util/minheap.MinHeap#pop
     * @returns {Object} the minimum scored object contained within the heap.
     */
    MinHeap.prototype.peek = function() {
        return this.heap[0];
    };

    /**
     * Return the current number of elements within the heap.
     * @method module:util/minheap.MinHeap#size
     * @returns {Number} size of the heap.
     */
    MinHeap.prototype.size = function() {
        return this.heap.length;
    };

    /**
     * Removes everything in the heap
     * @method module:util/minheap.MinHeap#clear
     * @returns {Object} This heap
     */
    MinHeap.prototype.clear = function() {
        this.heap.length = 0;
        return this;
    };

    return MinHeap;
});

/*global define*/
define('util/stats',[],function() {

    

    /**
     * @module util/stats
     */

    /**
     * Construct a stats recorder.
     * @constructor module:util/stats.Stats
     */
    function Stats() {

        this.samples = {};
        this.totals = {};

        /**
         * A named map of stats and their averages over the last 10 samples.
         * E.g. <code>stats.averages['fps'];</code>
         * @type {Object}
         * @member module:util/stats.Stats#averages
         */
        this.averages = {};
    }

    /**
     * Count a named stat. The last 10 recorded stats for each name will be stored
     * and accessible as averages.
     * @method module:util/stats.Stats#count
     * @param  {String} name The stat to count
     * @param  {Number} val  The new value for the stat
     */
    Stats.prototype.count = function(name, val) {
        var s, t;
        if (!this.samples.hasOwnProperty(name)) {
            s = [];
            t=0;
            this.samples[name] = s;
        } else {
            t = this.totals[name];
            s = this.samples[name];
        }
        s.push(val);
        t+=val;
        if (s.length>10) {
            t -= s[0];
            s.splice(0,1);
        }
        this.totals[name]=t;
        this.averages[name]=t/s.length;
    };


    return Stats;
});

/*global define*/
define('util/uid',[],function() {

    

    /**
     * @module util/uid
     */

    var next = 1;

    /**
     * Generates unique IDs
     * @function module:util/uid#uid
     * @return {Number} A unique ID
     */
    return function() {
        return next++;
    };

});

/*global define*/
define('util/url',[],function() {

    

    /**
     * @module util/url
     */

    return {
        /**
         * Extracts query string values from the current window's URL
         * @function module:util/url#queryStringValue
         * @param {String} name The query string name
         * @return {String} The query string value, or null
         */
        queryStringValue: function(name)
        {
            var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        }
    };

});

/*global define*/
define('util/all',[
    'util/preload',
    'util/rnd',
    'util/bitmap',
    'util/debug',
    'util/js',
    'util/minheap',
    'util/stats',
    'util/uid',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, MinHeap, Stats, uid, Url) {

    

    /**
     * @module util/all
     * @private
     */

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        MinHeap: MinHeap,
        Stats: Stats,
        uid: uid,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});

/*global define*/
define('map/tile',[],function() {

    

    /**
     * @module map/tile
     */

     /* TODO: Is this entire module private? */

    /** Represents a map tile
     * @constructor module:map/tile.Tile
     * @param {DOMElement} img The source image
     * @param {Number} x The x position in the image of the tile
     * @param {Number} y The y position in the image of the tile
     * @param {Number} w The width of a tile
     * @param {Number} h The height of a tile
     * @param {Number} xoverdraw How much beyond the tile bounds does
     * this tile draw, extending to the right
     * @param {Number} yoverdraw How much beyond the tile bounds does
     * this tile draw, extending upwards
     * @param {Number} defaultProps Default properties for this tile type
     * @param {Number} properties Properties for this tile instance, which override
     * the defaults.
     */
    function Tile(img, x, y, w, h, xoverdraw, yoverdraw, defaultProps, properties) {
        this.img = img;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.xoverdraw = xoverdraw;
        this.yoverdraw = yoverdraw;
        this.defaultProps = defaultProps||{};
        this.properties = properties||{};
    }

    /**
     * @method module:map/tile.Tile#draw
     * @private
     */
    Tile.prototype.draw = function(ctx, x, y) {
        ctx.drawImage(
                /* src */
                this.img,
                this.x, this.y,
                this.w, this.h,
                /*dest*/
                x-this.xoverdraw, y-this.yoverdraw,
                this.w, this.h
            );
    };

    /** Inserts a new layer into the layer list.
     * @method module:map/tile.Tile#getProperty
     * @param {String} prop The property to get
     * @return {String} The string value or undefined
     */
    Tile.prototype.getProperty = function(prop) {
        if (this.properties.hasOwnProperty(prop)) {
            return this.properties[prop];
        }

        if (this.defaultProps.hasOwnProperty(prop)) {
            return this.defaultProps[prop];
        }

        return undefined;
    };

    return Tile;

});

/*global define*/
define('map/staggered-isometric',['map/tile', 'util/bitmap', 'util/debug', 'util/js'], function(Tile, Bitmap, debug, js) {

    

    /**
     * @module map/staggered-isometric
     */

    var debugText = debug.debugText;
    var copyProps = js.copyProps;

    var xy = [0,0]; // work area

    /** Represents a map of type 'staggered' created with the
     * {@link http://www.mapeditor.org/|tiled} map editor.
     * @constructor module:map/staggered-isometric.StaggeredIsometric
     * @param {Object} tileData The map's data, parsed from the JSON exported
     * map data.
     * @param {Object} hitTests An object of keys and values where the keys are
     * image names and the values are image paths that should be preloaded. These are
     * the hit test image maps.
     * @param {Number} clientWidth The width of the canvas client area
     * @param {Number} clientHeight The height of the canvas client area
     * @param {Object} [stats] An object that will receive new properties representing
     * runtime statistics, for debug purposes.
     */
    function StaggeredIsometric(tileData, hitTests, clientWidth, clientHeight, stats) {
        this.data = tileData;
        this.hitTests = hitTests;
        this.maxXOverdraw = 0;
        this.maxYOverdraw = 0;

        /**
         * The canvas width
         * @type {Number}
         * @member module:map/staggered-isometric.StaggeredIsometric#clientWidth
         */
        this.clientWidth = clientWidth;

        /**
         * The canvas height
         * @type {Number}
         * @member module:map/staggered-isometric.StaggeredIsometric#clientHeight
         */
        this.clientHeight = clientHeight;
        this.hideBuildings = false;

        this.type = this.data.orientation;

        this.minxoffset = this.data.tilewidth/2;
        this.minyoffset = this.data.tileheight/2;

        this.maxxoffset = this.data.width * this.data.tilewidth - this.clientWidth - 1;
        this.maxyoffset = this.data.height * (this.data.tileheight/2) - this.clientHeight - 1;

        /* Start in SW-corner by default */
        this.xoffset = this.minxoffset;
        this.yoffset = this.maxyoffset;

        this.stats = stats;
    }

    /**
     * @private
     * @method module:map/staggered-isometric.StaggeredIsometric#isStaggered
     * @return {Boolean} True if the map type is staggered isometric.
     */
    StaggeredIsometric.prototype.isStaggered = function() {
        /* TODO: Why in heck would a StaggeredIsometric class be managing
         * non-staggered map data? This exists only for the benefit of naive
         * unit tests in the pathfinder. */
        return this.type==='staggered';
    };

    /**
     * @private
     * @method module:map/staggered-isometric.StaggeredIsometric#isOrthogonal
     * @return {Boolean} True if the map type is orthogonal.
     */
    StaggeredIsometric.prototype.isOrthogonal = function() {
        /* TODO: Why in heck would a StaggeredIsometric class be managing
         * orthogonal map data? This exists only for the benefit of naive
         * unit tests in the pathfinder. */
        return this.type==='orthogonal';
    };

    /**
     * Returns the dimensions of one tile. Return value is via a 2-length
     * spanned array passed in as an output parameter.
     * @method module:map/staggered-isometric.StaggeredIsometric#tileDimensions
     * @param {Array} out An array of length 2 that will receive the tile dimensions,
     * x then y.
     */
    StaggeredIsometric.prototype.tileDimensions = function(out) {
        out[0] = this.data.tilewidth;
        out[1] = this.data.tileheight;
    };

    /**
     * Primes a preloader with the images required for a map (I.e. the tiles).
     * @method module:map/staggered-isometric.StaggeredIsometric#primePreloader
     * @param {Object} preloader A preloader object.
     */
    StaggeredIsometric.prototype.primePreloader = function(preloader) {

        /* TODO Docs link to preloader class. */

        var map = this.data;
        var _this = this;

        /* Add tiles to the preloader */
        var storeTile = function(image, ts){
            ts.image = image;
        };

        for (var i = 0; i < map.tilesets.length; i++) {
            var ts = map.tilesets[i];
            preloader.add(ts.image, ts, storeTile);
        }

        var storeHitTest = function(image, name) {
            if (image.width!==map.tilewidth || image.height!==map.tileheight) {
                throw "Hit test image "+name+" does not match map tile size";
            }

            if (name==='hit') {
                _this.hitTest = Bitmap.imageToRData(image);
                /* TODO: It should be noted in documentation that the hit test image
                 * should under no circumstances be re-saved with a colour profile attached. */

                /* TODO: A unit test to ensure the integrity of the hitmap image data
                 * would be helpful. */
            } else {
                /* TODO: Figure out what to do with custom hit test images */
            }
        };

        for(var testName in this.hitTests) {
            preloader.add(this.hitTests[testName], testName, storeHitTest);
        }
    };

    var fixTypes = function(props) {
        if (props===undefined) {
            return props;
        }
        for (var prop in props) {
            if (prop==='height' && typeof props[prop]==='string') {
                props[prop] = parseInt(props[prop], 10);
            }
        }
        return props;
    };

    /** Get a tile by it's row and column position in the original map data.
     * @method module:map/staggered-isometric.StaggeredIsometric#getTile
     * @param  {Object} layer. The layer to search for tiles.
     * @param  {Number} c The column, aka x position in the data.
     * @param  {Number} r the row, aka y position in the data.
     * @return {Object} A tile, or null if the input was out of range.
     */
    StaggeredIsometric.prototype.getTile = function(layer, c, r) {
        /* TODO: Link to Tile class in documentation. */
        /* TODO: Validate that this is a tiled layer. */
        var rows = layer.rows;
        if (c<0||r<0 || r>=rows.length) {
            return null;
        }

        var row = rows[r];

        if (c>=row.length) {
            return null;
        }

        return row[c];
    };

    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#resolveTiles
     * @private
     */
    StaggeredIsometric.prototype.resolveTiles = function() {

        var i, j, k, ts, tileprops;

        var map = this.data;

        for (k = map.tilesets.length - 1; k >= 0; k--) {
            ts = map.tilesets[k];
            ts.xspan = Math.floor(ts.imagewidth / ts.tilewidth);
            ts.yspan = Math.floor(ts.imageheight / ts.tileheight);
        }

        for (i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];
            l.rows = [];
            var row = [];
            for (j = 0; j < l.data.length; j++) {
                var d = l.data[j];
                if (d===0) {
                    row.push(null);
                } else {
                    for (k = map.tilesets.length - 1; k >= 0; k--) {
                        ts = map.tilesets[k];
                        if(ts.firstgid<=d) {
                            break;
                        }
                    }
                    var t = d - ts.firstgid;
                    var y = Math.floor(t / ts.xspan); /* TODO: Vague feeling that x,y are redundant here. May be calculable in the Tile ctor if needed. */
                    var x = t - ts.xspan * y;

                    var xoverdraw = ts.tilewidth - map.tilewidth;
                    var yoverdraw = ts.tileheight - map.tileheight;

                    this.maxXOverdraw = Math.max(xoverdraw, this.maxXOverdraw);
                    this.maxYOverdraw = Math.max(yoverdraw, this.maxYOverdraw);

                    tileprops = undefined;
                    if (ts.tileproperties!==undefined && ts.tileproperties.hasOwnProperty(t)) {
                        tileprops = ts.tileproperties[t];
                    }

                    row.push(new Tile(
                            ts.image,
                            x * ts.tilewidth,
                            y * ts.tileheight,
                            ts.tilewidth,
                            ts.tileheight,
                            ts.tilewidth - map.tilewidth,
                            ts.tileheight - map.tileheight,
                            fixTypes(ts.properties),
                            fixTypes(tileprops)
                        ));
                }

                if (row.length>= l.width) {
                    l.rows.push(row);
                    row = [];
                }
            }
        }
    };

    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#drawDebugRegions
     * @private
     */
    StaggeredIsometric.prototype.drawDebugRegions = function(ctx) {

        var map = this.data;
        var l, layerEndY, layerEndX, r, x, y, i, stagger;

        var xstep = map.tilewidth;
        var ystep = map.tileheight / 2;

        var starty = Math.floor((this.yoffset-ystep) / ystep);
        var endy = Math.floor((this.yoffset+this.clientHeight-ystep+this.maxYOverdraw) / ystep)+1;

        var startx = Math.floor((this.xoffset+this.clientWidth -1 ) / xstep);
        var endx = Math.floor((this.xoffset-xstep/2-this.maxXOverdraw) / xstep);

        l = map.layers[0];

        layerEndY = Math.min(endy, l.rows.length-1);
        layerEndX = Math.max(endx, 0);

        var showRedGreen = false; /* Switch on here for odd/even region info */

        for (y = starty; y <= layerEndY; y++) {
            r = l.rows[y];
            var redgreen;
            if (y&1) {
                stagger = map.tilewidth/2;
                redgreen = '#f00';
            } else {
                stagger = 0;
                redgreen = '#0f0';
            }

            for (x = startx; x >= layerEndX; x--) {

                var rx = Math.floor(-this.xoffset) + stagger + x * xstep;
                var ry = Math.floor(-this.yoffset) + y * ystep;
                var rw = map.tilewidth;
                var rh = map.tileheight;

                if (showRedGreen) {
                    ctx.strokeStyle = redgreen;
                    ctx.strokeRect(rx, ry, rw, rh);
                }

                ctx.strokeStyle = '#aaa';
                ctx.beginPath();
                ctx.moveTo(rx, ry + rh/2);
                ctx.lineTo(rx+rw/2, ry);
                ctx.lineTo(rx+rw, ry+rh/2);
                ctx.lineTo(rx+rw/2, ry+rh);
                ctx.closePath();
                ctx.stroke();
            }
        }

        l = map.layers[0];

        for (y = 0; y < l.rows.length; y++) {
            r = l.rows[y];
            stagger = y&1?map.tilewidth/2:0;
            for (x = r.length-1; x >= 0; x--) {
                debugText(ctx,
                        x+","+y,
                        85+Math.floor(-this.xoffset) + stagger + x * xstep,
                        55+Math.floor(-this.yoffset) + y * ystep);
            }
        }
    };

    /** Scrolls the map to the given world coordinate, limited to the set map
     * bounds.
     * @method module:map/staggered-isometric.StaggeredIsometric#scrollTo
     * @param  {Number} x The X world position to scroll to
     * @param  {Number} y The Y world position to scroll to
     */
    StaggeredIsometric.prototype.scrollTo = function(x, y) {
        this.xoffset=x;
        this.yoffset=y;

        if (this.xoffset < this.minxoffset) {
            this.xoffset = this.minxoffset;
        } else if (this.xoffset > this.maxxoffset) {
            this.xoffset = this.maxxoffset;
        }

        if (this.yoffset < this.minyoffset) {
            this.yoffset = this.minyoffset;
        } else if (this.yoffset > this.maxyoffset) {
            this.yoffset = this.maxyoffset;
        }
    };

    /** Scrolls the map by a given amound in pixels, limited to the set map
     * bounds.
     * @method module:map/staggered-isometric.StaggeredIsometric#scroll
     * @param  {Number} dx The X amount to scroll by
     * @param  {Number} dy The Y amount to scroll by
     */
    StaggeredIsometric.prototype.scroll = function(dx,dy) {
        this.scrollTo(this.xoffset+dx, this.yoffset+dy);
    };

    /** Gets an object describing the pixel limits of the world edges.
     * @method module:map/staggered-isometric.StaggeredIsometric#getWorldEdges
     * @return {Object} Contains 4 properties, le, te, re and be which hold
     * the left, top, right and bottom edges respectively.
     */
    StaggeredIsometric.prototype.getWorldEdges = function() {
        return {
            le:this.minxoffset,
            te:this.minyoffset,
            re:this.maxxoffset+this.clientWidth,
            be:this.maxyoffset+this.clientHeight
        };
    };

    /* TODO: We really need to remove the whole 'out' 2-length array thing. */

    /** Takes a world position and tells you what tile it lies on. Take
     * care with the return value, the function signature is all backwards.
     * @method module:map/staggered-isometric.StaggeredIsometric#worldToTilePos
     * @param {Number} x A world x position
     * @param {Number} y A world y position
     * @param {Array} out A 2-length array that will recieve the tile x/y
     * position in its 0/1 values.
     * @return {Number} The distance from the given world position to the
     * closest tile edge, capped at 127px.
     */
    StaggeredIsometric.prototype.worldToTilePos = function(x, y, out) {
        // http://gamedev.stackexchange.com/a/48507/3188

        var map = this.data;

        var tw = map.tilewidth;
        var th = map.tileheight;

        x=x|0;
        y=y|0;

        var eventilex = Math.floor(x%tw);
        var eventiley = Math.floor(y%th);

        var dist = this.hitTest[eventilex + eventiley * tw];

        if (dist >= 128) {
            /* On even tile */

            out[0] = (((x + tw) / tw)|0) - 1;
            out[1] = 2 * ((((y + th) / th)|0) - 1);

            return dist-128;
        } else {
            /* On odd tile */

            out[0] = (((x + tw / 2) / tw)|0) - 1;
            out[1] = 2 * (((y + th / 2) / th)|0) - 1;

            return dist;
        }
    };

    /** Takes a tile position and returns a property value as defined by the tiles.
     * Tiles are checked from the top-most layer down until a tile is found that
     * holds that property. This means that top-most tiles can override property
     * values from lower tiles.
     * @method module:map/staggered-isometric.StaggeredIsometric#getTilePropAtTilePos
     * @param {String} prop The property to get
     * @param {Number} x A world x position
     * @param {Number} y A world y position
     * @return {String} The property value, or <code>undefined</code> if not found.
     */
    StaggeredIsometric.prototype.getTilePropAtTilePos = function(prop, x, y) {
        var layers = this.data.layers;
        var propval;
        for (var i = layers.length - 1; i >= 0; i--) {
            var rows = layers[i].rows;
            if (rows!==undefined) {
                if (y>=0&&y<rows.length) {
                    var t = rows[y][x];
                    if (t) {
                        propval = t.getProperty(prop);
                        if (propval!==undefined) {
                            return propval;
                        }
                    }
                }
            }
        }
        return undefined;
    };

    /** Takes a world position and returns a property value as defined by the tiles
     * underneath that coordinate.
     * Tiles are checked from the top-most layer down until a tile is found that
     * holds that property. This means that top-most tiles can override property
     * values from lower tiles.
     * @method module:map/staggered-isometric.StaggeredIsometric#getTilePropAtWorldPos
     * @param {String} prop The property to get
     * @param {Number} x A world x position
     * @param {Number} y A world y position
     * @return {String} The property value, or <code>undefined</code> if not found.
     */
    StaggeredIsometric.prototype.getTilePropAtWorldPos = function(prop, x, y) {
        /*(void)*/this.worldToTilePos(x, y, xy);
        return this.getTilePropAtTilePos(prop, xy[0], xy[1]);
    };

    /** Takes a screen position and tells you what tile it lies on. Take
     * care with the return value, the function signature is all backwards.
     * @method module:map/staggered-isometric.StaggeredIsometric#screenToTilePos
     * @param {Number} x A screen x position
     * @param {Number} y A screen y position
     * @param {Array} out A 2-length array that will recieve the tile x/y
     * position in its 0/1 values.
     * @return {Number} The distance from the given screen position to the
     * closest tile edge, capped at 127px.
     */
    StaggeredIsometric.prototype.screenToTilePos = function(x, y, out) {
        return this.worldToTilePos(x+this.xoffset, y+this.yoffset, out);
    };

    /** Convert a screen coordinate to a world coordinate.
     * @method module:map/staggered-isometric.StaggeredIsometric#screenToWorldPos
     * @param {Array} out Returned values via passed-in array. Must be 2-length.
     * Order is x,y
     */
    StaggeredIsometric.prototype.screenToWorldPos = function(x,y,out) {
        out[0] = x+this.xoffset;
        out[1] = y+this.yoffset;
    };


    /** Convert a world coordinate to a screen coordinate.
     * @method module:map/staggered-isometric.StaggeredIsometric#worldToScreenPos
     * @param {Array} out Returned values via passed-in array. Must be 2-length.
     * Order is x,y
     */
    StaggeredIsometric.prototype.worldToScreenPos = function(x, y, out) {
        out[0] = x-this.xoffset;
        out[1] = y-this.yoffset;
    };

    /** Inserts a new layer into the layer list.
     * @method module:map/staggered-isometric.StaggeredIsometric#insertLayer
     * @param {Number} idx The index to insert the layer at.
     * @param {Object} layer The layer to insert. Normally created via a
     * layer plugin.
     */
    StaggeredIsometric.prototype.insertLayer = function(idx, layer) {
        this.data.layers.splice(idx,0,layer);
    };

    /* TODO: Find all private marked functions and make sure they're actually private. */

    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#updateLayers
     * @private
     */
    StaggeredIsometric.prototype.updateLayers = function(now) {
        var epoch = +new Date();
        var map = this.data;
        for (var i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];
            if (l.hasOwnProperty('update')) {
                l.update(now);
            }
        }
        this.stats.count('updateLayers', (+new Date())-epoch);
    };

    /** Finds the index of the ground layer.
     * @method module:map/staggered-isometric.StaggeredIsometric#groundLayer
     * @return {Number} The index of the ground layer.
     */
    StaggeredIsometric.prototype.groundLayer = function() {
        var map = this.data;
        for (var i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];

            if ('draw' in l || !l.visible) {
                continue;
            }

            return l;
        }

        return undefined;

    };

    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#onResize
     * @private
     */
    StaggeredIsometric.prototype.onResize = function(w, h) {
        this.clientWidth = w;
        this.clientHeight = h;

        this.maxxoffset = this.data.width * this.data.tilewidth - this.clientWidth - 1;
        this.maxyoffset = this.data.height * (this.data.tileheight/2) - this.clientHeight - 1;
    };


    /**
     * @method module:map/staggered-isometric.StaggeredIsometric#drawWorld
     * @private
     */
    StaggeredIsometric.prototype.drawWorld = function(ctx, now, sprites) {

        var map = this.data;

        var epoch;

        var xstep = map.tilewidth;
        var ystep = map.tileheight / 2;

        var starty = Math.floor((this.yoffset-ystep) / ystep);
        var endy = Math.floor((this.yoffset+this.clientHeight-ystep+this.maxYOverdraw) / ystep)+1;

        var startx = Math.floor((this.xoffset+this.clientWidth -1 ) / xstep);
        var endx = Math.floor((this.xoffset-xstep/2-this.maxXOverdraw) / xstep);

        epoch = +new Date();
        /* Sort sprites first by y-axis, then by height, then creation order */
        /* TODO: Cull off-screen sprites first? */
        sprites.sort(function(a, b) {
            var n = a.y - b.y;
            if (n!==0) {
                return n;
            }
            n = a.h - b.h;
            return n!==0?n:a.nuid - b.nuid;
        });
        this.stats.count('spriteSort', (+new Date())-epoch);


        epoch = +new Date();
        var spriteCursor = 0;
        var stagger = 0;
        var x, y, r, l, i, layerEndY, layerEndX;
        var top = map.layers.length-1;
        for (i = 0; i < map.layers.length; i++) {
            l = map.layers[i];
            var showBuildings = !this.hideBuildings||i!==top;

            if ('draw' in l) {
                l.draw(ctx, now);
                continue;
            }

            if (!l.visible) {
                continue;
            }

            layerEndY = Math.min(endy, l.rows.length-1);
            layerEndX = Math.max(endx, 0);

            for (y = starty; y <= layerEndY; y++) {
                r = l.rows[y];
                stagger = y&1?map.tilewidth/2:0;
                for (x = startx; x >= layerEndX; x--) {
                    var t = r[x];
                    if (t!==null&&showBuildings) {
                        t.draw(
                                ctx,
                                Math.floor(-this.xoffset) + stagger + x * xstep,
                                Math.floor(-this.yoffset) + y * ystep);
                    }
                }

                if (i===top) {
                    var z = (y+2) * ystep;
                    while(spriteCursor<sprites.length && z>=sprites[spriteCursor].y) {
                        sprites[spriteCursor++].draw(ctx, this.xoffset, this.yoffset, now);
                    }
                }
            }
        }
        this.stats.count('paintWorld', (+new Date())-epoch);
    };

    return StaggeredIsometric;

});

/*global define*/
define('plugins/sprite/bounce',[],function() {

    

    var sn;

    /**
     * @module plugins/sprite/bounce
     */

    /**
     * A simple way to make a sprite bounce by adjusting its height property. The sprite will bounce
     * with a duration matching the current state's animation.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>update:[{name:'bounce'}]</code>.
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>bounce_height</dt><dd>How high it should bounce in pixels.</dd>
     *  <dt>bounce_base</dt><dd>Where is the 'floor'? E.g. a bounce_base of 25 and an bounce height
     *  of 100 will bounce up 100px on top of the floor level of 25. The height value will
     *  be 125 at its apex, midway through the state animation.</dd>
     * </dl>
     * @constructor module:plugins/sprite/bounce.Bounce
     */
    function Bounce() {

    }

    /** Called with the sprite as the function context.
     * @method module:plugins/sprite/bounce.Bounce#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Bounce.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        var b = s.state.jogPos(s.epoch, sn.getNow()); /* 0..1 */
        b*=2;
        b-=1;
        b*=b;

        s.h = this.bounce_base + this.bounce_height * (1-b);
        return true;
    };

    /**
     * @method module:plugins/sprite/bounce.Bounce#init
     * @private
     */
    Bounce.prototype.init = function(sprite) {
        this.sprite = sprite;
    };

    /**
     * @method module:plugins/sprite/bounce.Bounce#onSpriteRemoved
     * @private
     */
    Bounce.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('bounce', Bounce);
    };

});

/*global define*/
define('plugins/sprite/follow-mouse',[],function() {

    

    var pos = [0,0];
    var sn;

    /**
     * @module plugins/sprite/follow-mouse
     */

    /**
     * A simple way to make a sprite track the mouse position.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>update:[{name:'follow_mouse'}]</code>.
     * <p>
     * This plugin takes no options.
     * @constructor module:plugins/sprite/follow-mouse.FollowMouse
     */
    function FollowMouse() {

    }

    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @method module:plugins/sprite/follow-mouse.FollowMouse#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    FollowMouse.prototype.update = function(now, phaseOn) {

        sn.mouseWorldPos(pos);
        var s = this.sprite;
        s.x = pos[0];
        s.y = pos[1];
        return true;
    };

    /**
     * @method module:plugins/sprite/follow-mouse.FollowMouse#init
     * @private
     */
    FollowMouse.prototype.init = function(sprite) {
        this.sprite = sprite;
    };

    /**
     * @method module:plugins/sprite/follow-mouse.FollowMouse#onSpriteRemoved
     * @private
     */
    FollowMouse.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('follow_mouse', FollowMouse); /* TODO: Underscores are inconsistent */
    };

});

/*global define*/
define('plugins/sprite/animate',[],function() {

    

    var sn;

    /**
     * @module plugins/sprite/animate
     */

    /**
     * A sprite updater that animates one or more properties on the sprite. Properties are modified
     * directly, so handle with care. Be aware that property updates on things such as position will bypass
     * the automatic direction setting you'd get if you had called {@link module:sprites/sprite.Sprite#move|move}
     * on your sprite.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>updates:[{name:'animate'}]</code>.
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>tween</dt><dd>The name of the tween function. See the {@link animate/tween|tweens} module for a full list of options.</dd>
     *  <dt>props</dt><dd>An object describing the properties to adjust. Values are relative adjustments, not
     *     absolute values. E.g.
     *     <pre>
     *     props: {
     *         x: 20,
     *         y: 30
     *     }
     *     </pre>
     *     Will increase x by 20 and y by 30.
     *     </dd>
     *  <dt>duration</dt><dd>The duration of the tween in milliseconds. If omitted, the duration will
     *      be automatically calculated from the maxloops lifespan of the sprite. The tweener assumes
     *      from this that the state will not change.</dd>
     * </dl>
     * @constructor module:plugins/sprite/animate.Animate
     */
    function Animate() {
    }


    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @method module:plugins/sprite/animate.Animate#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Animate.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        var t = now - this.epoch;
        for(var prop in this.props) {
            s[prop] = this.tweenfn(t, this.begin[prop], this.props[prop], this.duration);
        }
        return true;
    };

    /**
     * @method module:plugins/sprite/animate.Animate#init
     * @private
     */
    Animate.prototype.init = function(s) {
        this.sprite = s;
        if (this.duration===undefined) {
            /* If duration is omitted, take the sprite duration in its current state. */
            this.duration = s.maxDuration();
        }

        this.begin = {};
        for(var prop in this.props) {
            this.begin[prop] = s[prop];
        }

        /* Guard against /0 in tweens with a trivial minimum duration. 1ms will be guaranteed
         * to have expired on the next frame. */
        this.duration = Math.max(this.duration, 1);

        if (!sn.tweens.hasOwnProperty(this.tween)) {
            throw "Unrecognized tween in animate plugin: "+this.tween;
        }

        /* Turn the name into a fn */
        this.tweenfn = sn.tweens[this.tween];

        this.epoch = sn.getNow();
    };

    /**
     * @method module:plugins/sprite/animate.Animate#onSpriteRemoved
     * @private
     */
    Animate.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('animate', Animate);
    };

});

/*global define*/
define('plugins/sprite/8way',[],function() {

    

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
     * This plugin takes no options.
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

        this.direction = d;

        this.oldx = s.x;
        this.oldy = s.y;

        s.setState(s.stateName, this.direction);

        return true;
    };

    /**
     * @method module:plugins/sprite/8way.Face8Way#init
     * @private
     */
    Face8Way.prototype.init = function(sprite) {
        this.sprite = sprite;
        this.direction = 'e';
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

/*global define*/
define('plugins/sprite/track',[],function() {

    

    var sn;

    /**
     * @module plugins/sprite/track
     */

    /**
     * A plugin that gets triggered whenever a sprite's position changes.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>update:[{name:'track'}]</code>.
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>fn</dt><dd>A function to call whenever the position changes. If the position hasn't
     *    changed since the last frame, this function will not be called. The function is of the
     *    form
     *    <pre>
     *    function(sprite) {
     *        // track sprite
     *    }
     *    </pre>
     *    </dd>
     *  <dt>register</dt><dd>A function to call when the sprite is registered with this plugin.
     *  The function is of the form
     *    <pre>
     *    function(sprite) {
     *        // register sprite
     *    }
     *    </pre>
     *    </dd>
     *  <dt>deregister</dt><dd>A function to call when the sprite is removed from the stage.
     *  The function is of the form
     *    <pre>
     *    function(sprite) {
     *        // deregister sprite
     *    }
     *    </pre>
     *    </dd>
     * </dl>
     * The register and deregister functions are useful when combined with the
     * {@link module:ai/proximity-tracker.ProximityTracker|ProximityTracker}
     * to track large numbers of autonomous sprites. See
     * {@link module:ai/proximity-tracker.ProximityTracker|ProximityTracker.track} for
     * an example of how to set that up.
     * @constructor module:plugins/sprite/track.Track
     */
    function Track() {
    }

    /** Called with the update options as the function context, one of which
     * is this.sprite, which refers to the sprite being updated.
     * @method module:plugins/sprite/track.Track#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    Track.prototype.update = function(now, phaseOn) {

        var s = this.sprite;

        if (s.x!==this.x || s.y!==this.y || s.h!==this.h) {
            this.fn(s);
            this.x=s.x;
            this.y=s.y;
            this.h=s.h;
        }

        return true;
    };

    /**
     * @method module:plugins/sprite/track.Track#onSpriteRemoved
     * @private
     */
    Track.prototype.onSpriteRemoved = function() {
        if (this.deregister) {
            this.deregister(this.sprite);
        }
    };

    /**
     * @method module:plugins/sprite/track.Track#init
     * @private
     */
    Track.prototype.init = function(s) {
        this.sprite = s;
        this.x=s.x;
        this.y=s.y;
        this.h=s.h;
        if (this.register) {
            this.register(s);
        }
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('track', Track);
    };

});

/*global define*/
define('plugins/sprite/flock',[],function() {

    

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
        this.xy=[0,0];
        this.xy2=[0,0];
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

/*global define*/
define('plugins/sprite/apply-velocity',[],function() {

    

    var sn;

    /**
     * @module plugins/sprite/apply-velocity
     */

    /**
     * A sprite updater that simply takes the velocityx and velocityy properties on the sprite and
     * applies it to the position via {@link module:sprites/sprite.Sprite#move|move}. This is useful
     * in situations where another plugin is updating valocities but those velocities depend upon
     * the momentary positions of sprites. E.g. you have a flock update which updates velocity.
     * In that case you would have this plugin as a commit to apply the velocity calculated by flock.
     * <p>
     * Snaps runs all sprite updates first, then runs all sprite commits.
     * <p>
     * Note that this should not be constructed directly, but rather via the updates or commit
     * property in your spawnSprite data, e.g. <code>commit:[{name:'apply-velocity'}]</code>.
     * <p>
     * Alongside the name, you can pass the following options
     * <dl>
     *  <dt>on_collision</dt><dd>An optional function that is called if the sprite could not
     *  be moved to it's target position due to collision. This function will be called with the
     *  sprite as the function context.</dd>
     * </dl>
     * @constructor module:plugins/sprite/apply-velocity.ApplyVelocity
     */
    function ApplyVelocity() {
        /* TODO: Pass collision ratio to the collision callback */
    }


    /** Called with the sprite as the function context.
     * @method module:plugins/sprite/apply-velocity.ApplyVelocity#update
     * @private
     * @param  {Number} now The time of the current frame
     * @param  {Boolean} phaseOn If the update is controlled by a phaser,
     * this will be true to hint that we do a full batch of work, or false
     * to hint that we try to exit as trivially as possible. Ignored on this
     * plugin.
     * @return true normally, or false to prevent any further
     * plugins being called on this sprite for this frame.
     */
    ApplyVelocity.prototype.update = function(now, phaseOn) {
        var s = this.sprite;
        if(s.move(s.velocityx, s.velocityy) && this.on_collision!==undefined) {
            this.on_collision.call(s);
        }
        return true;
    };

    /**
     * @method module:plugins/sprite/apply-velocity.ApplyVelocity#init
     * @private
     */
    ApplyVelocity.prototype.init = function(sprite) {
        this.sprite = sprite;
    };

    /**
     * @method module:plugins/sprite/apply-velocity.ApplyVelocity#onSpriteRemoved
     * @private
     */
    ApplyVelocity.prototype.onSpriteRemoved = function() {
    };

    return function(snaps) {
        sn = snaps;
        sn.registerSpriteUpdater('apply-velocity', ApplyVelocity);
    };

});

/*global define*/
define('plugins/layer/ui',[],function() {

    

    /**
     * @module plugins/layer/ui
     */

    var sn;

    /**
     * A layer that provides user interface features in the form of mouse or touch
     * responsive widgets.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * <code>sn.addLayer('ui')</code> on the engine.
     * @constructor module:plugins/layer/ui.UI
     * @param {String} layerName A name for the layer. You might see it later on in
     * error messages.
     * @param {Object} opts Parameters for customizing the layer. There are no parameters
     * for this layer plugin though, so feel free not to pass any in.
     */
    function UI(layerName, opts) {
        this.opts = opts||{};
        this.name = layerName;
    }

    /**
     * @method module:plugins/layer/ui.UI#update
     * @private
     */
    UI.prototype.update = function(now) {
    };

    /**
     * @method module:plugins/layer/ui.UI#draw
     * @private
     */
    UI.prototype.draw = function(ctx, now) {

        /* TODO: Draw widgets */
    };

    return function(snaps) {
        sn = snaps;
        sn.registerLayerPlugin('ui', UI);
    };

});

/*global define*/
define('plugins/layer/ground-sprites',['sprites/sprite',
        'util/uid'],

function(Sprite, uid) {

    

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
     * @param {Object} [opts] Optional parameter object. For a list of parameters
     * see the opts parameter on the {@link module:sprites/sprite.Sprite|Sprite class constructor}.
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
        sn.registerLayerPlugin('ground-sprites', GroundSprites);
    };

});

/*global define*/
define('plugins/fx/particles',[
    'sprites/sprite',
    'sprites/composite',
    'util/rnd'
], function(Sprite, Composite, utilRnd) {

    

    /**
     * @module plugins/fx/particles
     */

    var sn;

    var rnd = utilRnd.rnd;

    /** Spawns particles in a composite sprite.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * <code>sn.fx('particles')</code> on the engine.
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

/*global define*/
define('plugins/ai/phasers/time-phaser',[],function() {

    

    /**
     * @module plugins/ai/phasers/time-phaser
     */

    var sn;

    /** Construct a phaser that performs a set number of sprite updates per second. Note that this
     * should not be constructed directly, but rather via the plugin factory method
     * <code>sn.createPhaser('time-phaser')</code> on the engine.
     * @constructor module:plugins/ai/phasers/time-phaser.TimePhaser
     * @param {String} id A unique ID
     * @param {Object} [opts] An object with assorted options set in it.
     * <dl>
     *  <dt>updatesPerSecond</dt><dd>How many sprites should be updated each second? Must be >0.</dd>
     *  <dt>frameCap</dt><dd>On slow devices where the frame time exceeds 1s, every sprite will be in phase.
     *    To combat this, we cap the possible measured frame time to something <1s.
     *    This sacrifices update quality in order to give all sprites a change to have
     *    some off-phase updates. This is based on the reasoning that you should
     *    not expect things to run perfectly if your frame rate is that low.</dd>
     * </dl>
     */
    function TimePhaser(id, opts) {
        this.id = id;
        opts = opts || {};
        if (opts.updatesPerSecond===undefined || opts.updatesPerSecond<1) {
            throw "Time phasers must define a >0 number of updates per second.";
        }
        this.updatesPerSecond = opts.updatesPerSecond;
        this.lastUpdate = 0;
        this.updatesThisFrame = 0;
        this.sprites = [];

        if (opts.frameCap===undefined) {
            this.frameCap = 750; /* Frames will pretend they took no more than 750ms */
        } else {
            this.frameCap = Math.min(1000, (opts.frameCap * 1000)|0);
        }
    }

    /**
     * Determines if a sprite should be updated on this phase
     * @method module:plugins/ai/phasers/time-phaser.TimePhaser#phase
     * @private
     */
    TimePhaser.prototype.phase = function(sprite, now) {
        var data = sprite.phaserData[this.id];
        if(data.phaseOn) {
            data.lastUpdate = now;
        }
        return data.phaseOn;
    };

    /**
     * Adds a sprite to this phaser. The phaser will reschedule the sprites
     * but cannot guarantee the first frame of update the sprite will receive.
     * @method module:plugins/ai/phasers/time-phaser.TimePhaser#addSprite
     * @param {Object} s The sprite to add
     */
    TimePhaser.prototype.addSprite = function(s) {
        if (s.phaserData===undefined) {
            s.phaserData = {};
        }
        s.phaserData[this.id] = { lastUpdate: 0 };
        this.sprites.push(s);
    };

    /**
     * Removes a sprite from this phaser.
     * @method module:plugins/ai/phasers/time-phaser.TimePhaser#removeSprite
     * @private
     * @param {Object} s The sprite to remove
     */
    TimePhaser.prototype.removeSprite = function(s) {
        /* To remove a sprite, we just remove the data for this
         * phaser. Later, when we rebalance, we look for this state
         * and remove it from the list. */
        delete s.phaserData[this.id];
    };

    /**
     * Rebalance the schedule to account for recent sprite additions or deletions.
     * @method module:plugins/ai/phasers/time-phaser.TimePhaser#rebalance
     * @private
     */
    TimePhaser.prototype.rebalance = function(now) {
        var timeSinceLastFrame = Math.min(this.frameCap, now - this.lastUpdate);
        this.lastUpdate = now;
        var updateBudget = Math.floor(timeSinceLastFrame * this.updatesPerSecond / 1000);

        var i, s;

        var id = this.id;

        var sprites = this.sprites;

        sprites.sort(function(a, b) {
            return b.phaserData[id].lastUpdate - a.phaserData[id].lastUpdate;
        });

        var deleted = 0;
        for (i = sprites.length - 1; i >= 0; i--) {
            s = sprites[i];
            if (s.phaserData.hasOwnProperty(this.id)) {
                s.phaserData[this.id].phaseOn = (updateBudget--)>0;
            } else {
                deleted++;
            }
        }

        /* TODO: Perhaps we only want to remove dead sprites if the dead sprite count
         * exceeds some limit */
        if (deleted>0) {
            sprites = [];
            var len = this.sprites.length;
            for (i = 0; i < len; i++) {
                s = sprites[i];
                if (s.phaserData.hasOwnProperty(this.id)) {
                    sprites.push(s);
                }
            }
            this.sprites = sprites;
        }
    };


    return function(snaps) {
        sn = snaps;
        sn.registerPhaserPlugin('time-phaser', TimePhaser);
    };
});

/*global define*/
define('plugins/ai/phasers/frame-phaser',[],function() {

    

    /**
     * @module plugins/ai/phasers/frame-phaser
     */

    var sn;

    /** Construct a phaser that performs a set number of sprite updates per frame. Note that this
     * should not be constructed directly, but rather via the plugin factory method
     * <code>sn.createPhaser('frame-phaser')</code> on the engine.
     * @constructor module:plugins/ai/phasers/frame-phaser.FramePhaser
     * @param {String} id A unique ID
     * @param {Object} [opts] An object with assorted options set in it.
     * <dl>
     *  <dt>phases</dt><dd>How many sprites should be updated on each frame? Must be at least 2.</dd>
     * </dl>
     */
    function FramePhaser(id, opts) {
        /* TODO: All plugins should link to their factory methods via doc link tags */
        /* TODO: All plgins: Passing IDs into things and promising it's unique is a bit smelly. */
        this.id = id;
        opts = opts || {};
        if (opts.phases===undefined || opts.phases<2) {
            throw "Frame phasers must have at least 2 phases.";
        }
        this.phases = opts.phases;
        this.buckets = new Array(opts.phases);
        this.bucketMax = new Array(opts.phases);
        this.sprites = [];
    }

    /**
     * Determines if a sprite should be updated on this phase
     * @method module:plugins/ai/phasers/frame-phaser.FramePhaser#phase
     * @private
     */
    FramePhaser.prototype.phase = function(sprite, now) {
        var data = sprite.phaserData[this.id];
        return data.phase===0;
    };


    /**
     * Adds a sprite to this phaser. The phaser will reschedule the sprites
     * but cannot guarantee the first frame of update the sprite will receive.
     * @method module:plugins/ai/phasers/frame-phaser.FramePhaser#addSprite
     * @param {Object} s The {@link module:sprites/sprite.Sprite|sprite} to add
     */
    FramePhaser.prototype.addSprite = function(s) {
        if (s.phaserData===undefined) {
            s.phaserData = {};
        }
        s.phaserData[this.id] = { phase: this.phases-1 };
        this.sprites.push(s);
    };

    /**
     * Removes a sprite from this phaser.
     * @method module:plugins/ai/phasers/frame-phaser.FramePhaser#removeSprite
     * @private
     * @param {Object} s The sprite to remove
     */
    FramePhaser.prototype.removeSprite = function(s) {
        /* To remove a sprite, we just remove the data for this
         * phaser. Later, when we rebalance, we look for this state
         * and remove it from the list. */
        delete s.phaserData[this.id];
    };

    /**
     * Rebalance the schedule to account for recent sprite additions or deletions.
     * @method module:plugins/ai/phasers/frame-phaser.FramePhaser#rebalance
     * @private
     */
    FramePhaser.prototype.rebalance = function(now) {
        var i, s, data, max = 0;
        var buckets = this.buckets;

        var sprites = this.sprites;

        var desiredMax = sprites.length/this.phases;

        for (i = buckets.length - 1; i >= 0; i--) {
            buckets[i] = 0;
            this.bucketMax[i] = Math.floor((i+1)*desiredMax - Math.floor(i*desiredMax));
        }

        var clearing = [];
        var deleted = 0;
        for (i = sprites.length - 1; i >= 0; i--) {
            s = sprites[i];
            if (s.phaserData.hasOwnProperty(this.id)) {
                data = s.phaserData[this.id];
                data.phase++;
                if (data.phase>=this.phases) {
                    data.phase = 0;
                }
                max = Math.max(max, ++buckets[data.phase]);
                if (buckets[data.phase]>this.bucketMax[data.phase]) {
                    clearing.push(s);
                }
            } else {
                deleted++;
            }
        }

        if (desiredMax>1 && desiredMax/max<0.8) { /* Only if the buckets get noticeably unbalanced do we re-sort them */

            var bucketIdx = 0;
            for (i = clearing.length - 1; i >= 0; i--) {
                s = clearing[i];
                while(buckets[bucketIdx]>=this.bucketMax[bucketIdx]) {
                    bucketIdx++;
                    if (bucketIdx===this.phases) {
                        bucketIdx = 0;
                    }
                }
                data = s.phaserData[this.id];
                buckets[data.phase]--;
                data.phase = bucketIdx;
                buckets[bucketIdx]++;
            }
        }

        /* TODO: Perhaps we only want to remove dead sprites if the dead sprite count
         * exceeds some limit */
        if (deleted>0) {
            sprites = [];
            var len = this.sprites.length;
            for (i = 0; i < len; i++) {
                if (s.phaserData.hasOwnProperty(this.id)) {
                    sprites.push(this.sprites[i]);
                }
            }
            this.sprites = sprites;
        }

    };


    return function(snaps) {
        sn = snaps;
        sn.registerPhaserPlugin('frame-phaser', FramePhaser);
    };

});

/*global define*/
define('plugins/camera/push-cam',[],function() {

    

    /* TODO: Consistency: camera vs cameras */

    /**
     * @module plugins/ai/camera/push-cam
     */

    var sn;

    /** Constructs a camera that follows a sprite. Called a push cam because the player seems to
     * "push" the camera around. Note that this should not be constructed directly, but rather
     * via the plugin factory method <code>sn.createCamera('pushcam')</code> on the engine.
     * @constructor module:plugins/ai/camera/push-cam.PushCam
     * @param {Object} [opts] An object with assorted options set in it.
     * <dl>
     *  <dt>follow</dt><dd>The ID of the sprite to follow, e.g. <code>follow:"player1"</code></dd>
     * </dl>
     */
    function PushCam(opts) {
        /**
         * The sprite that this camera is following.
         * @type {Object}
         * @member module:plugins/ai/camera/push-cam.PushCam#follow
         */
        this.follow = sn.sprite(opts.follow);
        if (!this.follow) {
            throw "Camera can't follow missing sprite: "+opts.follow;
        }
    }

    /**
     * Called per frame
     * @method module:plugins/ai/camera/push-cam.PushCam#update
     * @private
     */
    PushCam.prototype.update = function(now) {
        sn.scrollTo(this.follow.x-sn.clientWidth/2, this.follow.y-sn.clientHeight/2);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerCameraPlugin('pushcam', PushCam);
    };

});

/*global define*/
define('plugins/collision/lib/prop-scanner',[],function() {

    

    /**
     * @module plugins/collision/lib/prop-scanner
     * @private
     */

    /**
     * Trace along a path in a line, sampling a given property until it breaches
     * some limit. AKA a linear collision trace.
     * @function module:plugins/collision/lib/prop-scanner#traceProp
     * @param  {Object} sn Engine reference
     * @param  {String} prop  The property to sample. Normally 'height'
     * @param  {Object} edges A description of the world edges. See
     * {@link module:map/staggered-isometric.StaggeredIsometric#getWorldEdges|getWorldEdges}
     * @param  {Number} x0    Starting point x world coordinate
     * @param  {Number} y0    Starting point y world coordinate
     * @param  {Number} dx    Desired X movement
     * @param  {Number} dy    Desired Y movement
     * @param  {Number} h     Property limit. If prop is > h, it's a collision
     * @param  {Array} out   Spanned array of length 2 that will receive the colllision point.
     * Point will be written as <code>[x,y]</code>. If there is no collision, the output point
     * will be the destination point.
     * @param  {Array} route A spanned array in the form <code>[x,y,x,y,x,y...]</code> that
     * will receive the pixels traced along the line up to the point of collision. If the array had
     * any contents before being passed in, it will be destroyed.
     * @return {Number} The ratio of the path completed before collision. 1 indicates no collision.
     * <1 indicates a collision, e.g. 0.8 means it got 80% along the desired path before colliding.
     */
    var traceProp = function(sn, prop, edges, x0, y0, dx, dy, h, out, route){

        var i;

        var ox0 = x0;
        var oy0 = y0;
        var odx = dx;
        var ody = dy;

        var sampleHeight;

        var x1 = (x0 + dx)|0;
        var y1 = (y0 + dy)|0;

        x0=x0|0;
        y0=y0|0;
        dx = Math.abs(x1-x0);
        dy = Math.abs(y1-y0);

        var routeidx = 0;
        if (route!==undefined) {
            route.length = 0;
            route.length = 2*(Math.max(dx, dy)+1);
        }

        if (dx === 0 && dy === 0) {
            out[0] = x0;
            out[1] = y0;
            return 1;
        }

        /* The mighty Bresenham's line algorithm */
        var sx = (x0 < x1) ? 1 : -1;
        var sy = (y0 < y1) ? 1 : -1;
        var err = dx-dy;

        var collided = false;
        var x0clear = x0;
        var y0clear = y0;

        /* Skip the first pixel, we can assume it's good. */
        if (route!==undefined) {
            route[routeidx++] = x0;
            route[routeidx++] = y0;
        }

        var e2 = 2*err;
        if (e2 >-dy){
            err -= dy;
            x0  += sx; /* Skippity */
        }
        if (e2 < dx) {
            err += dx;
            y0  += sy; /* Skip */
        }

        while(true){
            if (x0<edges.le || x0>edges.re || y0<edges.te || y0> edges.be) {
                collided = true;
                break;
            }

            sampleHeight = sn.getTilePropAtWorldPos(prop,x0,y0);

            if(sampleHeight>h) {
                collided = true;
                break;
            }

            x0clear = x0;
            y0clear = y0;

            if (route!==undefined) {
                route[routeidx++] = x0;
                route[routeidx++] = y0;
            }

            if ((x0===x1) && (y0===y1)) {
                break;
            }

            e2 = 2*err;

            if (e2 >-dy){
                err -= dy;
                x0  += sx;
            }

            if (e2 < dx) {
                err += dx;
                y0  += sy;
            }
        }

        /* Populate the output final point for the caller */
        if (collided) {
            if (out!==undefined) {
                out[0] = x0clear;
                out[1] = y0clear;
            }
        } else if (out!==undefined) {
            out[0] = ox0+odx;
            out[1] = oy0+ody;
        }

        if (route!==undefined) {
            route.length = routeidx;
        }

        /* No collision indicated by 1 in returned collision ratio */
        if (!collided) {
            return 1;
        }

        /* Return a ratio of path completed, e.g. 0.5 means half of the path
         * was traversed before being stopped by collision. */
        if (dx>dy) {
            return (out[0]-ox0)/odx;
        } else {
            return (out[1]-oy0)/ody;
        }
    };

    return traceProp;
});

/*global define*/
define('plugins/collision/lib/local-scanner',[],function() {

    

    /**
     * @module plugins/collision/lib/local-scanner
     * @private
     */

    /**
     * For a given point and angle of movement, this function determines whether
     * the start point should be nudged up or down a pixel in order to compensate
     * for the possibility of getting caught on jagged pixel edges. The nudged value
     * should be passed into a collision tracer instead of the true value.
     * @function module:plugins/collision/lib/local-scanner#ySlip
     * @param  {Object} sn Engine reference
     * @param  {Number} x  Start point x world position
     * @param  {Number} y  Start point y world position
     * @param  {Number} h  Level height. Anything above this is solid.
     * @param  {Number} dx Amount we'd like to move in x direction
     * @param  {Number} dy Amount we'd like to move in y direction
     * @return {Number} 0, 1 or -1 as the amount to nudge the starting y position.
     */
    var ySlip = function(sn, x, y, h, dx, dy) {
        var localmask;
        var r = dx/dy;

        if (r>=2&&r<=3) {

            /* nw/se */

            if (sn.getTilePropAtWorldPos('height',x+1,y-1)>h &&    //  .##
                    sn.getTilePropAtWorldPos('height',x,y-1)>h &&  //  .o#
                    sn.getTilePropAtWorldPos('height',x+1,y)>h) {  //  ...

                /* Technically we should test that our shifted y position is not solid,
                 * but really if you are using collision maps that look like that then
                 * you're asking for trouble. */
                return 1;

            } else if(sn.getTilePropAtWorldPos('height',x-1,y+1)>h &&  //  ...
                    sn.getTilePropAtWorldPos('height',x-1,y)>h &&      //  #o.
                    sn.getTilePropAtWorldPos('height',x,y+1)>h) {      //  ##.

                return -1;
            }

        } else if (r<=-2&&r>=-3) {

            /* sw/ne */

            if (sn.getTilePropAtWorldPos('height',x+1,y+1)>h &&    //  ...
                    sn.getTilePropAtWorldPos('height',x,y+1)>h &&  //  .o#
                    sn.getTilePropAtWorldPos('height',x+1,y)>h) {  //  .##

                return -1;

            } else if(sn.getTilePropAtWorldPos('height',x-1,y-1)>h &&  //  ##.
                    sn.getTilePropAtWorldPos('height',x-1,y)>h &&      //  #o.
                    sn.getTilePropAtWorldPos('height',x,y-1)>h) {      //  ...

                return 1;
            }
        }

        return 0;
    };

    return {
        ySlip:ySlip
    };
});

/*global define*/
define('plugins/collision/sprite-with-map/line-trace',[
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/local-scanner'],
function(traceProp, localScan) {

    

    var sn;

    /**
     * @module plugins/collision/sprite-with-map/line-trace
     */

    var ySlip = localScan.ySlip;

    /**
     * Creates a tracer that traces a line along a path to detect collision.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * <code>sn.createCollider('line-trace')</code> on the engine.
     * @constructor module:plugins/collision/sprite-with-map/line-trace.LineTrace
     * @param {Object} opts An object with assorted options set in it.
     * <dl>
     *  <dt>autoSlip</dt><dd>Defaults to true for isometric maps. If set, the collision trace
     *  will 'slip' away from jagged pixel edges to prevent sprites from being caught up in
     *  jaggies when moving at isometric angles. In unsure, omit this property to use the
     *  default.</dd>
     * </dl>
     */
    function LineTrace(opts) {
        opts = opts || {};
        this.sn = sn;
        this.edges = sn.getWorldEdges();
        this.xy = [0,0];

        if (opts.autoSlip===undefined) {
            this.autoSlip = true;
            /* TODO: This should default to true ONLY for isometric maps. */
        } else {
            this.autoSlip = opts.autoSlip;
        }
    }


    /** Perform a trace to test for collision along a line.
     * @method module:plugins/collision/sprite-with-map/line-trace.LineTrace#test
     * @param  {Number} x0  World X position of the starting point
     * @param  {Number} y0  World Y position of the starting point
     * @param  {Number} dx  Amount to move in the X axis
     * @param  {Number} dy  Amount to move in the Y axis
     * @param  {Number} h   Tile pixel height considered the ground (non-collision)
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Number} A number from 0-1 representing how far along the route
     * the trace managed to get. 1 means no collision.
     */
    LineTrace.prototype.test = function(x0, y0, dx, dy, h, out){

        /* TODO: I don't actually think there's any reason to overload this function
         * so much. Perhaps duplicate and tweak it? */
        var safeDist = sn.worldToTilePos(x0, y0, this.xy);
        if (dx*dx+dy*dy<=safeDist*safeDist) {
            /* Trivial non-collision case */
            /* TODO: There may be an issue if height is involved. */
            out[0] = x0+dx;
            out[1] = y0+dy;
            return 1;
        }


        if (this.autoSlip) {
            /* First, distance ourself from key jagged shapes in key directions,
             * to ensure the player can slip past isometric lines without getting
             * caught on pixels. */
            y0 += ySlip(sn, x0, y0, h, dx, dy);
        }

        return traceProp(sn,
            'height',
            this.edges,
            x0,
            y0,
            dx,
            dy,
            h, out);
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('line-trace', LineTrace);
    };

});

/*global define*/
define('plugins/collision/lib/ellipse',[],function() {

    /**
     * @module plugins/collision/lib/ellipse
     * @private
     */


    /**
     * Returns an array of 0-centered sample points for an ellipse
     * using a variant of the midpoint circle algorithm.
     * HT {@link http://geofhagopian.net/sablog/Slog-october/slog-10-25-05.htm}
     * @function module:plugins/collision/lib/ellipse#ellipse
     * @param  {Number} rx The x radius. Pass an integer please.
     * @param  {Number} ry The y radius. Pass an integer please.
     * @return {Array} In the form <code>[x0,y0,x1,y1...]</code>. The points do
     * not describe a continuous path, but is complete.
     */
    return function(rx,ry) {
        var rx2 = rx * rx;
        var ry2 = ry * ry;
        var twoa2 = 2 * rx2;
        var twob2 = 2 * ry2;
        var p;
        var x = 0;
        var y = ry;
        var px = 0;
        var py = twoa2 * y;

        var s = [];

        /* Initial point in each quadrant. */
        s.push(x,y,-x,y,x,-y,-x,-y);

        /* Region 1 */
        p = Math.round (ry2 - (rx2 * ry) + (0.25 * rx2));
        while (px < py) {
            x++;
            px += twob2;
            if (p < 0) {
                p += ry2 + px;
            } else {
                y--;
                py -= twoa2;
                p += ry2 + px - py;
            }
            s.push(x,y,-x,y,x,-y,-x,-y);
        }

        /* Region 2 */
        p = Math.round (ry2 * (x+0.5) * (x+0.5) + rx2 * (y-1) * (y-1) - rx2 * ry2);
        while (y > 0) {
            y--;
            py -= twoa2;
            if (p > 0) {
                p += rx2 - py;
            } else {
                x++;
                px += twob2;
                p += rx2 - py + px;
            }
            s.push(x,y,-x,y,x,-y,-x,-y);
        }
        return s;
    };
});

/*global define*/
define('plugins/collision/sprite-with-map/circle-trace',[
    'plugins/collision/lib/prop-scanner',
    'plugins/collision/lib/ellipse',
    'plugins/collision/lib/local-scanner'],
function(traceProp, midPtEllipse, localScan) {

    

    /**
     * @module plugins/collision/sprite-with-map/circle-trace
     */

    var sn;

    var ySlip = localScan.ySlip;

    /**
     * Creates a circle tracer that traces a circle (An on-screen elipse in isometric-land)
     * along a path to detect collision.
     * Note that this should not be constructed directly, but rather via the plugin factory method
     * <code>sn.createCollider('circle-trace')</code> on the engine.
     * @constructor module:plugins/collision/sprite-with-map/circle-trace.CircleTrace
     * @param {Object} opts An object with assorted options set in it.
     * <dl>
     *  <dt>radius</dt><dd>The radius must be >0 and describes the x radius of the elipse as
     *  projected on-screen.</dd>
     *  <dt>autoSlip</dt><dd>Defaults to true for isometric maps. If set, the collision trace
     *  will 'slip' away from jagged pixel edges to prevent sprites from being caught up in
     *  jaggies when moving at isometric angles. In unsure, omit this property to use the
     *  default.</dd>
     * </dl>
     */
    function CircleTrace(opts) {

        opts = opts||{};
        this.sn = sn;

        if (opts.radius===undefined || opts.radius===0) {
            throw "Circle trace requires a radius >0 in its options.";
        }

        this.radius = opts.radius;

        this.edges = sn.getWorldEdges();

        /* We call this a circle trace, but we use a half-height ellipse
         * to represent the perspective distortion of the isometric
         * map. */
        this.samples = midPtEllipse(opts.radius|0, opts.radius/2|0);

        this.lineHit = [0,0];

        if (opts.autoSlip===undefined) {
            this.autoSlip = true;
            /* TODO: This should default to true ONLY for isometric maps. */
            /* TODO: Note in manual that autoslip is only useful for main player characters
             * that walk parallel to walls and that switching it off may improve performance
             * in certain circumstances. */
            /* TODO: Perhaps we should switch it off my default? */
        } else {
            this.autoSlip = opts.autoSlip;
        }
    }

    /** Perform a trace to test for collision along a line with radius.
     * Effectively traces an ellipse  from one point to another, with some
     * important performance compromises in accuracy.
     * @method module:plugins/collision/sprite-with-map/circle-trace.CircleTrace#test
     * @param  {Number} x0  World X position of the starting point
     * @param  {Number} y0  World Y position of the starting point
     * @param  {Number} dx  Amount to move in the X axis
     * @param  {Number} dy  Amount to move in the Y axis
     * @param  {Number} h   Tile pixel height considered the ground (non-collision)
     * @param  {Array} out An optional 2-length array which will recieve the
     * point of contact. You can interpret this as the position to which the
     * character can go along its path at which it will be touching a solid
     * object. If there is no collision, the output position will be the
     * desired new position.
     * @return {Number} A number from 0-1 representing how far along the route
     * the trace managed to get. 1 means no collision.
     */
    CircleTrace.prototype.test = function(x0, y0, dx, dy, h, out){

        var sxo, syo, i;

        /* TODO: Some evidence seems to show that the code actually runs slightly slower with
         * this code in place. Investigate this. */
        /* TODO: I don't actually think there's any reason to overload this function
         * so much. Perhaps duplicate and tweak it? */
        var safeDist = sn.worldToTilePos(x0, y0, this.lineHit);
        var xdx = Math.abs(dx)+this.radius;
        var xdy = Math.abs(dy/2)+this.radius/2;
        if (xdx*xdx+xdy*xdy<=safeDist*safeDist) {
            /* Trivial non-collision case */
            /* TODO: There may be an issue if height is involved. */
            out[0] = x0+dx;
            out[1] = y0+dy;
            return 1;
        }

        if (this.autoSlip) {
            /* First, distance ourself from key jagged shapes in key directions,
             * to ensure the player can slip past isometric lines without getting
             * caught on pixels. */
            var slip = 0;
            for (i = this.samples.length - 2; i >= 0; i-=2) {
                sxo = this.samples[i];
                syo = this.samples[i+1];
                var newslip = ySlip(sn, x0+sxo, y0+syo, h, dx, dy);

                if (slip===0) {
                    slip = newslip;
                } else if(newslip!==0 && slip!==newslip) {
                    slip = 0;
                    break;
                }
            }
            y0+=slip;
        }

        var route = []; /* Route will be populated with non-collision positions
                         * along the path. */
        var collisionRatio = traceProp(sn,
            'height',
            this.edges,
            x0, y0,
            dx, dy,
            h, this.lineHit, route);

        var routeidx = route.length - 2;
        var rx, ry;

        /* Trace backwards with the circle to find the rest point. */
        var collided = true;
        for (i = route.length - 2; i >= 2 && collided; i-=2) {
            collided = false;
            for (var j = this.samples.length - 2; j >= 0; j-=2) {
                sxo = this.samples[j];
                syo = this.samples[j+1];
                rx = route[i];
                ry = route[i+1];

                var sampleHeight = sn.getTilePropAtWorldPos('height',rx+sxo,ry+syo);

                if(sampleHeight>h) {
                    collided = true;
                    break;
                }
            }
            if (!collided) {
                if (i===route.length-2) {
                    /* Clear to the end/linear collision */
                    out[0] = this.lineHit[0];
                    out[1] = this.lineHit[1];
                    return collisionRatio;
                } else {
                    /* Clear to part-way along */
                    out[0] = rx;
                    out[1] = ry;
                    if (dx>dy) {
                        return (rx-x0)/dx;
                    } else {
                        return (ry-y0)/dy;
                    }
                }
            }
        }

        out[0] = x0;
        out[1] = y0;

        return 0;
    };

    return function(snaps) {
        sn = snaps;
        sn.registerColliderPlugin('circle-trace', CircleTrace);
    };

});

/*global define*/
define('plugins/default-plugins',[
    'plugins/sprite/bounce',
    'plugins/sprite/follow-mouse',
    'plugins/sprite/animate',
    'plugins/sprite/8way',
    'plugins/sprite/track',
    'plugins/sprite/flock',
    'plugins/sprite/apply-velocity',

    'plugins/layer/ui',
    'plugins/layer/ground-sprites',

    'plugins/fx/particles',

    'plugins/ai/phasers/time-phaser',
    'plugins/ai/phasers/frame-phaser',

    'plugins/camera/push-cam',

    'plugins/collision/sprite-with-map/line-trace',
    'plugins/collision/sprite-with-map/circle-trace'
    ],
function() {

    

    /**
     * @module plugins/default-plugins
     * @private
     */

    var plugins = arguments;

    return function(sn) {
        for (var i = 0; i < plugins.length; i++) {
            plugins[i](sn);
        }
    };

});

/*global define*/
define('animate/tween',[],function() {

    

    /* Via http://www.timotheegroleau.com/Flash/experiments/easing_function_generator.htm */

    /**
     * @module animate/tween
     */
    return {

        /**
         * Simple linear tween.
         * @function module:animate/tween#linear
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        linear: function(t, b, c, d)
        {
            return b+c*Math.min(1,t/d);
        },

        /**
         * Eases in and out of the animation
         * @function module:animate/tween#easeInOutCubic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInOutCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-2*tc + 3*ts);
        },

        /**
         * Eases softly in and out of the animation
         * @function module:animate/tween#easeInOutQuintic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInOutQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(6*tc*ts + -15*ts*ts + 10*tc);
        },

        /**
         * Eases very softly into the animation
         * @function module:animate/tween#easeInQuintic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc*ts);
        },

        /**
         * Eases softly into the animation
         * @function module:animate/tween#easeInQuartic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            return b+c*(ts*ts);
        },

        /**
         * Eases into the animation
         * @function module:animate/tween#easeInCubic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var tc=(t/=d)*t*t;
            return b+c*(tc);
        },

        /**
         * Eases quickly into the animation
         * @function module:animate/tween#easeInQuadratic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeInQuadratic: function(t, b, c, d) {
            t=Math.min(d,t);
            return b+c*(t*t/d);
        },

        /**
         * Eases very softly out of the animation
         * @function module:animate/tween#easeOutQuintic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeOutQuintic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc*ts + -5*ts*ts + 10*tc + -10*ts + 5*t);
        },

        /**
         * Eases softly out of the animation
         * @function module:animate/tween#easeOutQuartic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeOutQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-1*ts*ts + 4*tc + -6*ts + 4*t);
        },

        /**
         * Eases out of the animation
         * @function module:animate/tween#easeOutCubic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeOutCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(tc + -3*ts + 3*t);
        },

        /** Opposite of easing in and out. Starts and ends linearly, but
         * comes to a pause in the middle.
         * @function module:animate/tween#easeOutInCubic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        easeOutInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -6*ts + 3*t);
        },

        /** Moves back first before easing in.
         * @function module:animate/tween#backInCubic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        backInCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -3*ts);
        },

        /** Moves back first before easing in.
         * @function module:animate/tween#backInQuartic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        backInQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(2*ts*ts + 2*tc + -3*ts);
        },

        /** Overshoots, then eases back
         * @function module:animate/tween#outBackCubic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        outBackCubic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(4*tc + -9*ts + 6*t);
        },

        /** Overshoots, then eases back
         * @function module:animate/tween#outBackQuartic
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        outBackQuartic: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(-2*ts*ts + 10*tc + -15*ts + 8*t);
        },

        /** Bounces around the target point, then settles.
         * @function module:animate/tween#bounceOut
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        bounceOut: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(33*tc*ts + -106*ts*ts + 126*tc + -67*ts + 15*t);
        },

        /** Bounces around the start point, then moves quickly to the target.
         * @function module:animate/tween#bounceIn
         * @param  {Number} t Current time passed since the beginning of the animation. Must be >=0.
         * Will be clamped to the duration.
         * @param  {Number} b The start value of the property being tweened
         * @param  {Number} c The desired delta. E.g. if b = 10, and you want to tween it to 30, c
         * should be 20
         * @param  {Number} d The duration in the same units as t.
         * @return {Number} Current value at the given time.
         */
        bounceIn: function(t, b, c, d) {
            t=Math.min(d,t);
            var ts=(t/=d)*t;
            var tc=ts*t;
            return b+c*(33*tc*ts + -59*ts*ts + 32*tc + -5*ts);
        }
    };

});

/*global define*/
define('ai/proximity-tracker',[],function() {

    /**
     * @module ai/proximity-tracker
     */

    /**
     * The proximity tracker tracks sprites and allows you to perform fast queries
     * to find what sprites are closest to a given point.
     * <p>
     * The proximity tracker must be informed when a sprite moves. The easiest way to
     * do this is via the <code>track</code> sprite plugin. See
     * {@link module:ai/proximity-tracker.ProximityTracker|track} for implementation
     * details.
     * <p>
     * This constructor is curried when exposed through the engine ref,
     * so construct it without the first parameter, e.g.
     * new sn.ProximityTracker(myCellSize);
     * @constructor module:ai/proximity-tracker.ProximityTracker
     * @param {Number} cellSize The width of each cell in the regular grid
     * tracking the map contents.
     */
    function ProximityTracker(sn, cellSize) {

        /*
         * Cell size is the width. In isometric world, the height will be half.
         * This means that our scan will still be cells defined by a circle, but
         * the cells aren't square, so we'll be fine.
         */

        if (cellSize<2 ||(cellSize&1)!==0 || (cellSize!==cellSize|0)) {
            throw "Cell size must be an even integer > 0";
        }

        this.cellw=cellSize;
        this.cellh=cellSize/2;

        this.sn = sn;

        var edges = sn.getWorldEdges();

        this.le = edges.le;
        this.re = edges.re;
        this.te = edges.te;
        this.be = edges.be;

        var h = this.be-this.te;
        var w = this.re-this.le;
        this.span = w;

        h = Math.ceil(h / this.cellh);
        w = Math.ceil(w / this.cellw);

        this.cells = new Array(h*w);

        this.id = sn.util.uid();

        this.candidateCache = {};
    }

    var removeFromItsCell = function(sprite) {
        var pd = sprite.proximityData[this.id];
        if (pd.cell!==undefined) {
            var cell = this.cells[pd.cell];
            var idx = cell.sprites.indexOf(sprite);
            if (idx>=0) {
                cell.sprites.splice(idx,1);
            }
        }
    };

    var setCurrentCandidateCells = function(r) {
        r = Math.ceil(r/this.cellw);

        if(this.candidateCache.hasOwnProperty(r)) {
            var cache = this.candidateCache[r];
            this.certains = cache.certains;
            this.uncertains = cache.uncertains;
            return;
        }


        if (r===1) {
            /* Our circle algorithm breaks down with radius 1, so we treat it as a special
             * case and hand-creaft the values. */
            this.certains = [];
            var s = this.span;
            this.uncertains = [-s-1,-s,-s+1,-1,0,1,s-1,s,s+1];

        } else {
            this.certains = [];
            this.uncertains = [];

            var rmax = (r+1)*(r+1);
            var rmin = (r-1)*(r-1);
            for(var x = -r-1; x <= r+1; x++) {
                for(var y = -r-1; y <= r+1; y++) {

                    var x2 = x+(x>0?1:-1);
                    var y2 = y+(y>0?1:-1);
                    if((x2*x2+y2*y2)<(r*r)) {
                        this.certains.push(y*this.span+x);
                    } else {
                        var x1 = x-(x>0?1:-1);
                        var y1 = y-(y>0?1:-1);
                        if((x1*x1+y1*y1)<(r*r)) {
                            this.uncertains.push(y*this.span+x);
                        }
                    }
                }
            }

        }

        this.candidateCache[r] = {
            certains: this.certains,
            uncertains: this.uncertains
        };
    };

    /* TODO: Search for return tags in jsdoc and link them all to the classes
     * for those returns if they're snaps classes. */

    /** Finds the sprites nearest a point. Ignores height.
     * @method module:ai/proximity-tracker.ProximityTracker#find
     * @param {Number} x The x world position of the test point
     * @param {Number} y The y world position of the test point
     * @param {Number} r The radius to search. Note that although this is
     * in pixels, it is horizontal pixels. The search area will be an ellipse
     * to account for the isometric projection.
     * @param {Boolean} sort Pass true to have the results sorted in
     * ascending distance from the test point.
     * @return {Array} An array of sprites that fall within the search area.
     */
    ProximityTracker.prototype.find = function(x,y,r,sort) {

        /* This call sets the values in this.certains and this.uncertains appropriate to
         * the radius. */
        setCurrentCandidateCells.call(this, r);

        var i, j, oc, cell, s, r2, dx, dy;

        var found = [];

        var cx = (x/this.cellw)|0;
        var cy = (y/this.cellh)|0;
        var c = cy*this.span+cx;

        /* Cells that are certain to be within the radius are easy */
        for (i = this.certains.length - 1; i >= 0; i--) {
            oc = c+this.certains[i];
            if (oc>=0 && oc<this.cells.length) {
                cell = this.cells[oc];
                if (cell!==undefined) {
                    if (sort===true) {
                        /* Store distances in the sprite for sorting later */
                        for (j = cell.sprites.length - 1; j >= 0; j--) {
                            s = cell.sprites[j];
                            dx = x-s.x;
                            dy = (y-s.y)*2;
                            s.tmpDist2=(dx*dx+dy*dy);
                        }
                    }

                    found = found.concat(cell.sprites);
                }
            }
        }

        /* Cells that are not certain to be within the radius must have
         * every distance tested */
        for (r2 = r*r, i = this.uncertains.length - 1; i >= 0; i--) {
            oc = c+this.uncertains[i];
            if (oc>=0 && oc<this.cells.length) {
                cell = this.cells[oc];
                if (cell!==undefined) {
                    for (j = cell.sprites.length - 1; j >= 0; j--) {
                        s = cell.sprites[j];
                        dx = x-s.x;
                        dy = (y-s.y)*2;
                        s.tmpDist2=(dx*dx+dy*dy);
                        if(s.tmpDist2<=r2) {
                            found.push(s);
                        }
                    }
                }
            }
        }

        if (sort===true) {
            found.sort(function(a, b) {
                return a.tmpDist2 - b.tmpDist2;
            });
        }

        return found;
    };

    /** Use this in conjunction with the track plugin. Add it to the list of sprite
     * updaters on your tracked sprites, after the sprite has moved. E.g.
     *
     * <pre>
     * updates:[{
     *   name: 'some-sprite-moving-plugin'
     * }, {
     *   name:'track',
     *   fn: myTracker.track.bind(myProximityTracker),
     *   register: myTracker.register.bind(myProximityTracker),
     *   deregister: myTracker.unregister.bind(myProximityTracker)
     * }]
     * </pre>
     * @param {Object} sprite The sprite to update tracking information for.
     * @method module:ai/proximity-tracker.ProximityTracker#track
     */
    ProximityTracker.prototype.track = function(sprite) {
        var pd = sprite.proximityData[this.id];

        var x = (sprite.x/this.cellw)|0;
        var y = (sprite.y/this.cellh)|0;
        var c = y*this.span+x;

        if(c!==pd.cell) {
            removeFromItsCell.call(this, sprite);

            if (this.cells[c]===undefined) {
                this.cells[c] = {
                    sprites:[sprite]
                };
            } else {
                this.cells[c].sprites.push(sprite);
            }

            pd.cell = c;
        }

    };

    /** Register a sprite with this tracker.
     * See {@link module:ai/proximity-tracker.ProximityTracker|track} for
     * an example of how this is used with the track sprite plugin.
     * @method module:ai/proximity-tracker.ProximityTracker#register
     * @param {Object} sprite The sprite to register.
     */
    ProximityTracker.prototype.register = function(sprite) {

        var x = (sprite.x/this.cellw)|0;
        var y = (sprite.y/this.cellh)|0;
        var c = y*this.span+x;

        if (this.cells[c]===undefined) {
            this.cells[c] = {
                sprites:[sprite]
            };
        } else {
            this.cells[c].sprites.push(sprite);
        }

        sprite.proximityData = {};
        sprite.proximityData[this.id] = {cell: c};
        this.track(sprite);
    };

    /** Unregister a sprite with this tracker.
     * See {@link module:ai/proximity-tracker.ProximityTracker|track} for
     * an example of how this is used with the track sprite plugin.
     * @method module:ai/proximity-tracker.ProximityTracker#unregister
     * @param {Object} sprite The sprite to unregister.
     */
    ProximityTracker.prototype.unregister = function(sprite) {
        removeFromItsCell.call(this, sprite);
        delete sprite.proximityData[this.id];
    };

    return ProximityTracker;

});

/*global define*/

define('ai/pathfinder',[],function() {

    

    /**
     * @module ai/pathfinder
     */

    /** Internal structure representing a point of travel along a path.
     * @constructor module:ai/pathfinder.Node
     * @private
     * @param {Number} x X position of the node.
     * @param {Number} y Y position of the node.
     */
    function Node(x,y) {
        this.x = x;
        this.y = y;
        this.score = 0;
    }


    /** This constructor is curried when exposed through the engine ref,
     * so construct it without the first parameter, e.g.
     * new sn.PathFinder(solid, diagonals, ...);
     * @constructor module:ai/pathfinder.PathFinder
     * @param {Function} [solid] A function that determines if a position is
     * solid or not. Should accept an x,y position and return a boolean. True
     * for solid. If omitted, the default is to check the tile grid properties for
     * height>0
     * @param {Boolean} [diagonals=true] If set, the path will
     * include diagonal movements (Along tile corners).
     * @param {Boolean} [cutcorners=true] Only has an effect if
     * diagonals is true. If false, the path will move across tile edges when close to
     * solid tiles, i.e. it will avoid the possibility of trying to cut across a solid
     * corner.
     * @param {Function} [cost] A function that determines the cost factor of moving
     * into a tile. It should return 1 for a normal tile and a number >1 for a tile that has
     * some extra cost associated with moving into it. E.g. if a tile is water, return some
     * value >1 to make a route avoid water unless it has no easy option. The higher the cost,
     * the more likely it is that the water will be avoided.
     */
    function PathFinder(sn, solid, diagonals, cutcorners, cost) {

        this.sn = sn;
        var map = sn.map;
        this.ground = map.groundLayer();
        this.xcount = map.data.width;
        this.ycount = map.data.height;
        this.nodeRows = new Array(this.ycount);

        if (cutcorners===undefined) {
            cutcorners = true;
        }

        if (diagonals===undefined) {
            diagonals = true;
        }

        for (var i = this.nodeRows.length - 1; i >= 0; i--) {
            this.nodeRows[i] = new Array(this.xcount);
        }

        solid = solid || function(x, y) {
            return sn.getTilePropAtTilePos('height', x, y) > 0;
        };

        var r2=Math.sqrt(2); /* ~1.414 */

        this.cost = cost || function(x,y) {
            /* TODO: Test the overriding of this. */
            return 1;
        };

        /* TODO: Dynamic cost based on proximity of solid tiles. I.e. walk diagonally on open ground,
         * but orthogonally around the edges of buildings. */

        if(map.isStaggered()) {

            /* Staggered isometric map */

            /* The direction offsets look very weird here. On a staggered isometric map, we assume
             * the top of the screen is 'north'. If you move from tile to tile around the compass,
             * the offset jumps in the original orthogonally arranged tile data looks peculiar and
             * differs on odd and even rows. Trust me though, these values check out fine. */

            /*                               E  SE  S  SW   W  NW   N  NE   E  S   W   N */
            this.xdirectionsOdd = diagonals?[1,  1, 0,  0, -1,  0,  0,  1]:[1, 0, -1,  0]; /* TODO: On an isometric map, n,s,e,w are not diagonal */
            this.ydirectionsOdd = diagonals?[0,  1, 2,  1,  0, -1, -2, -1]:[0, 2,  0, -2];

            /*                                E  SE   S  SW   W  NW   N  NE   E   S   W   N */
            this.xdirectionsEven = diagonals?[1,  0,  0, -1, -1, -1,  0,  0]:[1,  0, -1,  0];
            this.ydirectionsEven = diagonals?[0,  1,  2,  1,  0, -1, -2, -1]:[0,  2,  0, -2];

            this.distances   = diagonals?[r2, 1, r2,  1, r2,  1, r2, 1]:[1, 1,  1, -1];

            if (cutcorners) {
                this.distance = function(idx) {
                    return this.distances[idx];
                };
            } else {
                this.distance = function(idx,x0,y0) {
                    /* In the case where we are moving diagonally past a solid tile, we return the cost as 3, which is
                     * > sqrt(2) */
                    var even = (y0&1)===0;
                    var dirsx = even?this.xdirectionsEven:this.xdirectionsOdd;
                    var dirsy = even?this.ydirectionsEven:this.ydirectionsOdd;
                    switch(idx) {
                        case 0: /* E */
                            return (solid(x0+dirsx[7], y0+dirsy[7]) || solid(x0+dirsx[1], y0+dirsy[1]))?3:this.distances[idx]; /* 7===NE, 1===SE*/
                        case 2: /* S */
                            return (solid(x0+dirsx[3], y0+dirsy[3]) || solid(x0+dirsx[1], y0+dirsy[1]))?3:this.distances[idx]; /* 3===SW, 1===SE*/
                        case 4: /* W */
                            return (solid(x0+dirsx[3], y0+dirsy[3]) || solid(x0+dirsx[5], y0+dirsy[5]))?3:this.distances[idx]; /* 3===SW, 5===NW*/
                        case 6: /* N */
                            return (solid(x0+dirsx[7], y0+dirsy[7]) || solid(x0+dirsx[5], y0+dirsy[5]))?3:this.distances[idx]; /* 7===NE, 5===NW*/
                        default:
                            return this.distances[idx];
                    }
                };
            }

            this.ndirections = this.xdirectionsOdd.length;

        } else if (map.isOrthogonal()) {

            /* Orthogonal map */

            /*                               E  SE  S  SW   W  NW   N  NE   E  S   W   N */
            this.xdirectionsOdd = diagonals?[1,  1, 0, -1, -1, -1,  0,  1]:[1, 0, -1,  0];
            this.ydirectionsOdd = diagonals?[0,  1, 1,  1,  0, -1, -1, -1]:[0, 1,  0, -1];

            this.xdirectionsEven = this.xdirectionsOdd;
            this.ydirectionsEven = this.ydirectionsOdd;

            this.distances   = diagonals?[1, r2, 1, r2,  1, r2,  1, r2]:[1, 1,  1, -1];

            if (cutcorners) {
                this.distance = function(idx) {
                    return this.distances[idx];
                };
            } else {
                throw "Unsupported cutcorners===false in map of type: "+map.type;
            }

            this.ndirections = this.xdirectionsOdd.length;

        } else {
            throw "Unsupported map orientation in PathFinder: "+map.type;
        }

        this.scoreHeap = new sn.MinHeap();

        this.node = function(x,y) {
            if (x<0||x>=this.xcount||y<0||y>=this.ycount) {
                return null;
            }

            if (solid(x,y)) {
                return null;
            }

            var n;
            if (this.nodeRows[y].length===0) {
                this.nodeRows[y].length = this.xcount;
            }

            if (this.nodeRows[y][x]===undefined) {
                n = new Node(x,y);
                this.nodeRows[y][x] = n;
            } else {
                return this.nodeRows[y][x];
            }

            return n;
        };


        this.reconstructPath = function(current) {

            var path = [];

            while(current.cameFrom) {
                path.push(current.x,current.y);
                current = current.cameFrom;
            }

            path.push(this.startx,this.starty);

            return path;
        };
    }

    /* TODO: Sweep the code and ensure that all functions are of the correct type as appropriate,
     * i.e. this.functions where provate access to this is required, prototype where interface is
     * exposed or there should be only one creation of the function and var functions where
     * the function has module scope and does not require this access. */

    var distance2 = function(x0,y0,x1,y1) {
        var dx = x1-x0;
        var dy = y1-y0;
        return (dx*dx)+(dy*dy);
    };

    /**
     * Transform a route of tile positions into a step-by-step path
     * @private
     * @param  {Array} route The route to transform
     * @param  {Array} nesw An array of values to push for each step, arranged
     * north first, moving clockwise.
     * @param {Number} span The number of values in nesw per direction
     * @return {Array} The transformed route
     */
    var transformRoute = function(route, nesw, span) {
        var map = this.sn.map;
        var newroute = [];

        /* In nesw:
         * 0   1   2   3   4   5   6   7
         * n  ne   e  se   s  sw   w  nw  */

        if(map.isStaggered()) {
            /* Route is 1D array arranged as x,y,x,y,x,y... We start 4 from the end and look
             * 1 pair ahead of the current pair to determine direction. */
            for (var i = route.length - 4; i >= 0; i-=2) {
                var y0 = route[i+1];
                var dx = route[i]-route[i+2];
                var dy = y0-route[i+3];

                /* If you're browsing this code and start to feel some sort of rage when you see
                 * the logic wrapped up in these ternary operators wrapped up in a switch statement,
                 * then I'm genuinely sorry. I do however find this sort of thing strangely beautiful.
                 * If it helps, here's a top tip that explains that !== is the same as xor:
                 * http://stackoverflow.com/a/4540443/974 */

                switch(dy) {
                    case -2:
                        /*                            n                  */
                        newroute.push.apply(newroute, nesw.slice(0, span));
                        continue;
                    case -1:
                        /*                                                        nw                         ne                        */
                        newroute.push.apply(newroute, (((dx===0)!==((y0&1)!==0)))?nesw.slice(7*span, 8*span):nesw.slice(1*span, 2*span));
                        continue;
                    case 0:
                        /*                                     e                          w                         */
                        newroute.push.apply(newroute, (dx===1)?nesw.slice(2*span, 3*span):nesw.slice(6*span, 7*span));
                        continue;
                    case 1:
                        /*                                                        sw                          se                       */
                        newroute.push.apply(newroute, (((dx===0)!==((y0&1)!==0)))?nesw.slice(5*span, 6*span):nesw.slice(3*span, 4*span));
                        continue;
                    default:
                        /*                            s                         */
                        newroute.push.apply(newroute, nesw.slice(4*span, 5*span));
                        continue;
                }
            }
        } else {
            throw "Unsupported map orientation in routeToDirections/routeToVectors: "+map.type;
        }
        return newroute;
    };


    /** Takes a route generated by {@link module:ai/pathfinder.PathFinder#route|route}
     * and creates a set of normalized vectors along the route that can be used
     * to influence movement.
     * @method module:ai/pathfinder.PathFinder#routeToVectors
     * @param {Array} route Route in the form returned by
     * {@link module:ai/pathfinder.PathFinder#route|route}.
     * @return {Array} A spanned array of 2D vectors in the form x,y,x,y,x,y...
     */
    PathFinder.prototype.routeToVectors = function(route) {
        return transformRoute.call(this,route,
            [ 0, -1,  // n
              1, -1,  // ne
              1,  0,  // e
              1,  1,  // se
              0,  1,  // s
             -1,  1,  // sw
             -1,  0,  // w
             -1, -1], // ne
            2);
    };

    /** Takes a route generated by {@link module:ai/pathfinder.PathFinder#route|route}
     * and creates a set of compass directions along the rotue that can be used
     * to set directional state extensions in sprites.
     * @method module:ai/pathfinder.PathFinder#routeToDirections
     * @param {Array} route Route in the form returned by
     * {@link module:ai/pathfinder.PathFinder#route|route}.
     * @return {Array} An array of directions, e.g. <code>['e', 'se', 's']</code>
     */
    PathFinder.prototype.routeToDirections = function(route) {
        return transformRoute.call(this,route, ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], 1);
    };

    /** Calculates a route from one position to another
     * @method module:ai/pathfinder.PathFinder#route
     * @param {Number} x0 X position of starting point
     * @param {Number} y0 X position of ending point
     * @param {Number} x1 Y position of starting point
     * @param {Number} y1 Y position of ending point
     * @return {Array} An array of points as a 1d spanned array
     * of the form x,y,x,y,x,y...
     */
    PathFinder.prototype.route = function(x0,y0,x1,y1) {

        var i;

        this.startx = x0;
        this.starty = y0;

        /* Reset everything */
        for (i = this.nodeRows.length - 1; i >= 0; i--) {
            this.nodeRows[i].length = 0;
        }
        var n = this.node(x0,y0);
        n.open = true;
        this.scoreHeap.clear().push(n);
        n.fscore = distance2(x0,y0,x1,y1);

        while(this.scoreHeap.size()>0)
        {
            var current = this.scoreHeap.peek();
            if (current.x===x1&&current.y===y1) {
                return this.reconstructPath(current);
            }

            this.scoreHeap.pop();
            current.closed = true;

            for (i = this.ndirections - 1; i >= 0; i--) {
                var even = (current.y&1)===0;
                var xd = even?this.xdirectionsEven[i]:this.xdirectionsOdd[i];
                var yd = even?this.ydirectionsEven[i]:this.ydirectionsOdd[i];
                var neighbour = this.node(current.x+xd,current.y+yd);
                if (neighbour===null) {
                    /* Can't move that way. */
                    continue;
                }

                var tscore = current.score + this.cost(current.x,current.y) * this.distance(i,current.x,current.y);
                if (neighbour.closed && tscore>=neighbour.score) {
                    continue;
                }

                if (!neighbour.open || tscore < neighbour.score) {
                    neighbour.cameFrom=current;
                    neighbour.score = tscore;
                    neighbour.fscore = neighbour.gscore+distance2(neighbour.x,neighbour.y,x1,y1);
                    if (!neighbour.open) {
                        neighbour.open = true;
                        this.scoreHeap.push(neighbour);
                    }
                }
            }
        }

        return [];
    };

    return PathFinder;

});

/*global define*/
define('polyfills/requestAnimationFrame',[],function() {

    

    /**
     * @module polyfills/requestAnimationFrame
     * @private
     */

    /* TODO: Camel case filename is inconsistent */

    // http://paulirish.com/2011/requestanimationframe-for-smart-animating/
    // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

    // requestAnimationFrame polyfill by Erik Möller
    // fixes from Paul Irish and Tino Zijdel

    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] ||
                                   window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
    }

});

/*global define*/
define('polyfills/bind',[],function() {

    /* https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind */

    

    /**
     * @module polyfills/bind
     * @private
     */

    if (!Function.prototype.bind) {
        Function.prototype.bind = function (oThis) {
            if (typeof this !== "function") {
                // closest thing possible to the ECMAScript 5 internal IsCallable function
                throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
                fToBind = this,
                NOP = function () {},
                fBound = function () {
                    return fToBind.apply(this instanceof NOP && oThis? this : oThis,
                                       aArgs.concat(Array.prototype.slice.call(arguments)));
                };

            NOP.prototype = this.prototype;
            fBound.prototype = new NOP();

            return fBound;
        };
    }

});

/*global define*/
define('snaps',['sprites/spritedef', 'sprites/sprite', 'sprites/composite',
        'input/keyboard', 'input/mouse',
        'util/all',
        'map/staggered-isometric',

        /* Plugins */
        'plugins/default-plugins',

        /* Animation */
        'animate/tween',

        /* AI */
        'ai/proximity-tracker',
        'ai/pathfinder',

        /* Non-referenced */
        'polyfills/requestAnimationFrame', 'polyfills/bind'],

function(SpriteDef, Sprite, Composite, Keyboard, Mouse, util, StaggeredIsometric,
        regPlugins,
        tweens,
        ProximityTracker, PathFinder) {

    /*
     * TODO: https://github.com/izb/snaps.js/wiki/Todo
     */

    


    /**
     * @module snaps
     */

    var debugText = util.debug.debugText;
    var copyProps = util.js.copyProps;
    var clone     = util.js.clone;
    var Preloader = util.Preloader;
    var MinHeap   = util.MinHeap;
    var uid       = util.uid;
    var Stats     = util.Stats;

    /**
     * The main class of the game engine
     * @constructor module:snaps.Snaps
     * @param {Object} game A game object
     * @param {String} canvasID The ID of a canvas on the page to render into
     * @param {Object} [settings] Assorted settings to control the engine behavior.
     */
    function Snaps(game, canvasID, settings) {

        /* TODO: Docs - document settings object options */

        var _this = this;

        /* For testing, we'd like to perhaps re-bind this function later, so... */
        this.requestAnimationFrame = window.requestAnimationFrame.bind(window);

        /* Make some functionality directly available to the game via the engine ref */

        /**
         * The contents of the util/* modules are exposed here for general use.
         * @member module:snaps.Snaps#util
         * @type {Object}
         */
        this.util = util;

        /**
         * The contents of the animate/tween module is exposed here for general use.
         * @member module:snaps.Snaps#tweens
         * @type {Object}
         */
        this.tweens = tweens;

        /**
         * The MinHeap constructor is exposed here for general use.
         * @member module:snaps.Snaps#MinHeap
         * @type {Function}
         */
        this.MinHeap = MinHeap;

        /**
         * The Stats constructor is exposed here for general use. To access standard running stats you
         * probably want {@link module:snaps.Snaps#stats|stats} instead.
         * @member module:snaps.Snaps#Stats
         * @type {Function}
         */
        this.Stats = Stats;

        /**
         * The ProximityTracker constructor is exposed here for general use.
         * @member module:snaps.Snaps#ProximityTracker
         * @type {Function}
         */
        this.ProximityTracker = ProximityTracker.bind(ProximityTracker, this);

        /**
         * The PathFinder constructor is exposed here for general use.
         * @member module:snaps.Snaps#PathFinder
         * @type {Function}
         */
        this.PathFinder = PathFinder.bind(PathFinder, this);

        settings = settings || {};
        this.dbgShowMouse     = !!settings.showMouse;
        this.dbgShowCounts    = !!settings.showCounts;
        this.dbgShowRegions   = !!settings.showRegions;
        this.dbgShowMouseTile = !!settings.showMouseTile;

        this.imageCache = {};

        this.spriteUpdaters = {};
        this.colliders = {};
        this.fxUpdaters = {};
        this.layerPlugins = {};
        this.cameraPlugins = {};
        this.phaserPlugins = {};

        /**
         * Exposes some standard running stats
         * @member module:snaps.Snaps#stats
         * @type {Object}
         */
        this.stats = new Stats();

        this.timers = {};
        this.cameras = {};
        this.camera = null;

        this.activeFX = [];

        this.now = 0;
        this.epoch = 0; /* 0 in chrome, but moz passes unix time. Epoch will be adjusted on first repaint */

        var c = document.getElementById(canvasID);
        this.clientWidth = c.clientWidth;
        this.clientHeight = c.clientHeight;
        this.ctx = c.getContext("2d");

        this.keyboard = new Keyboard();
        this.mouse = new Mouse(c);

        this.ctx.fillStyle='#000022';
        this.ctx.fillRect (0,0,c.clientWidth,c.clientHeight);

        this.game = game;
        if (game.map!==undefined) {
            if (typeof game.hitTests !== 'object' || game.hitTests.hit===undefined) {
                throw "Game must define a hitTests object with at least a 'hit' property";
            }

            /* Obviously we're assuming it's always a staggered isometric map.
             * We don't yet support anything else. */
            this.map = new StaggeredIsometric(game.map, game.hitTests, this.clientWidth, this.clientHeight, this.stats);
            this.map.hideBuildings = !!settings.hideBuildings;
        }

        var draw = _this.game.draw;
        var update = _this.game.update;

        this.spriteDefs = {};
        this.sprites = [];
        this.phasers = [];
        this.spriteMap = {};

        this.lastFrameTime = 0;

        /**
         * Registers a new updater plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerSpriteUpdater
         * @param  {String} name The name of the plugin.
         * @param  {Function} ctor The constructor of the sprite updater object.
         */
        this.registerSpriteUpdater = function(name, ctor) {
            _this.spriteUpdaters[name] = ctor;
        };

        /**
         * Registers a new effect plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerFxPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the fx updater object.
         */
        this.registerFxPlugin = function(name, fn) {
            _this.fxUpdaters[name] = fn;
        };

        /**
         * Registers a new layer plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerLayerPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the layer updater object.
         */
        this.registerLayerPlugin = function(name, fn) {
            _this.layerPlugins[name] = fn;
        };

        /**
         * Registers a new collider plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerColliderPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the collider object.
         */
        this.registerColliderPlugin = function(name, fn) {
            _this.colliders[name] = fn;
        };

        /**
         * Registers a new camera plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerCameraPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the camera object.
         */
        this.registerCameraPlugin = function(name, fn) {
            _this.cameraPlugins[name] = fn;
        };

        /**
         * Registers a new phaser plugin. See other plugin code for an example of how
         * to call this.
         * @method module:snaps.Snaps#registerPhaserPlugin
         * @param  {String} name The name of the plugin.
         * @param  {Function} fn The constructor of the phaser object.
         */
        this.registerPhaserPlugin = function(name, fn) {
            _this.phaserPlugins[name] = fn;
        };

        /* Register the default plugins */
        regPlugins(this);

        if (typeof _this.game.onEngineStart === 'function') {
            _this.game.onEngineStart(this);
        }

        var preloader = new Preloader();

        if (this.map!==undefined) {

            this.map.primePreloader(preloader);
        }

        /* Add game-added images to the preloader */
        if (typeof game.preloadImages === 'object') {

            var storePreloaded = function(image, tag){
                _this.imageCache[tag] = image;
            };
            for(var pathName in game.preloadImages) {
                preloader.add(game.preloadImages[pathName], pathName, storePreloaded);
            }
        }

        /* Add sprites to the preloader */
        if (typeof _this.game.spriteDefs === 'object') {

            var storeSpriteSheet = function(image, tag){

                var state;

                var data = _this.game.spriteDefs[tag];
                var sd = new SpriteDef(image, data.w, data.h, data.x, data.y);
                _this.spriteDefs[tag] = sd;

                for (state in data.states) {
                    if (typeof(data.states[state])==='object') {
                        sd.addState(state, data.states[state].seq, data.states[state].dur);
                    }

                    if (typeof(data.states[state])==='number') {
                        sd.addState(state, [data.states[state]], 1000);
                    }
                }

                for (state in data.states) {
                    if (typeof(data.states[state])==='string') {
                        sd.aliasState(state, data.states[state]);
                    }
                }
            };

            for(var spriteName in _this.game.spriteDefs) {
                preloader.add(_this.game.spriteDefs[spriteName].path, spriteName, storeSpriteSheet);
            }
        }

        /**
         * If your game object exposes a <code>preloadImages</code> property, then those images
         * will be preloaded by the engine along with the map images. Call this method to draw
         * the image by name, e.g.
         * <pre>
         * game.preloadImages = {
         *     logo: 'mylogo.png'
         * }
         * //...
         * sn.drawImage('logo', 50, 30);
         * </pre>
         * @method module:snaps.Snaps#drawImage
         * @param  {String} im The image name
         * @param  {Number} x  The screen x position
         * @param  {Number} y  The screen y position
         */
        this.drawImage = function(im, x, y) {
            _this.ctx.drawImage(_this.imageCache[im],x,y);
        };

        /**
         * Clears the screen. Normally you don't need to do this if your map has no holes
         * in it since the screen will be redrawn from corner to corner.
         * @method module:snaps.Snaps#cls
         * @param  {String} [col] The screen clearing color as a CSS color spec. Defaults to black.
         */
        this.cls = function(col) {
            _this.ctx.fillStyle = col||'#000';
            _this.ctx.fillRect (0,0,_this.clientWidth,_this.clientHeight);
        };

        /**
         * Call this to bind keys to actions which you can test later on with
         * the {@link module:snaps.Snaps#actioning|actioning} method.
         * <pre>
         * sn.bindKeys([
         *     {key:'left',  action:'left'},
         *     {key:'right', action:'right'},
         *     {key:'up',    action:'up'},
         *     {key:'down',  action:'down'},
         *
         *     // alternatives
         *     {key:'w', action:'up'},
         *     {key:'a', action:'left'},
         *     {key:'s', action:'down'},
         *     {key:'d', action:'right'}
         * ]);
         * </pre>
         * @method module:snaps.Snaps#bindKeys
         * @param  {Array} keybinds An array of objects exposing key and action
         * properties. See the description for an example.
         */
        this.bindKeys = function(keybinds) {
            for (var i = 0; i < keybinds.length; i++) {
                var keybind = keybinds[i];
                _this.keyboard.bind(keybind.key, keybind.action);
            }
        };

        /**
         * @method module:snaps.Snaps#updatePhasers
         * @private
         */
        this.updatePhasers = function() {
            var epoch = +new Date();
            for (var i = _this.phasers.length - 1; i >= 0; i--) {
                _this.phasers[i].rebalance(_this.now);
            }
            this.stats.count('updatePhasers', (+new Date())-epoch);
        };

        /**
         * @method module:snaps.Snaps#updateFX
         * @private
         */
        this.updateFX = function() {
            var epoch = +new Date();
            for (var i = _this.activeFX.length - 1; i >= 0; i--) {
                var fx = _this.activeFX[i];
                if (!fx.update(_this.now)) {
                    _this.activeFX.splice(i, 1);
                }
            }
            this.stats.count('updateFX', (+new Date())-epoch);
        };

        /**
         * Spawn a new fx instance
         * @method module:snaps.Snaps#fx
         * @param  {Number} name The fx plugin to instantiate
         * @param  {Object} [opts] Options to pass to the plugin
         */
        this.fx = function(name, opts) {
            if (!_this.fxUpdaters.hasOwnProperty(name)) {
                throw "Can't create FX for unregistered FX type: " + name;
            }
            _this.activeFX.push(new _this.fxUpdaters[name](opts));
        };

        /**
         * Insert a new layer
         * @method module:snaps.Snaps#addLayer
         * @param  {String} name A unique name for the new layer
         * @param  {String} type The layer plugin to instantiate
         * @param  {Object} [opts] Options to pass to the plugin
         * @param  {Number} idx The layer index to insert it at
         */
        this.addLayer = function(name, type, opts, idx) {
            /* TODO: name must be unique. */
            /* TODO: Instead of index, we should say which layer to insert after or before, e.g.
             * 'after ground' */

            opts = opts||{};

            if (!_this.layerPlugins.hasOwnProperty(type)) {
                throw "Can't create layer for unregistered layer type: " + type;
            }
            var layer = new _this.layerPlugins[type](name, opts);
            _this.map.insertLayer(idx, layer);
            return layer;
        };

        /**
         * Count the sprites on the stage, including those in composites
         * @method module:snaps.Snaps#spriteCount
         * @return  {Number} The number of sprites on the stage.
         */
        this.spriteCount = function() {
            var c = 0;
            for (var i = 0; i < _this.sprites.length; i++) {
                var s = _this.sprites[i];
                if (s instanceof Composite) {
                    c+=s.sprites.length;
                } else {
                    c++;
                }
            }
            return c;
        };

        function drawDebug() {

            if (_this.dbgShowMouse) {
                debugText(_this.ctx,
                        "Screen: "+_this.mouse.x+","+_this.mouse.y,5, 15);
                debugText(_this.ctx,
                        "World: "+(_this.mouse.x+_this.map.xoffset)+","+(_this.mouse.y+_this.map.yoffset), 5, 30);
                debugText(_this.ctx,
                        "Origin: "+(_this.map.xoffset)+","+(_this.map.yoffset), 5, 45);
            }

            if (_this.dbgShowCounts) {
                debugText(_this.ctx,
                        "Sprites: "+_this.spriteCount(),5, _this.clientHeight-15);
            }

            if (_this.dbgShowMouseTile && _this.map!==undefined) {
                var worldPos = [0,0];
                _this.mouseWorldPos(worldPos);
                var tilePos = [0,0];
                _this.worldToTilePos(worldPos[0], worldPos[1], tilePos);
                debugText(_this.ctx,
                        "Mouse in tile: "+tilePos[0]+", "+tilePos[1],5, _this.clientHeight-30);
            }
        }

        function loop(now) {
            if (now>315532800 && _this.epoch===0) {
                /* Hack due to differences between moz and chrome implementations of
                 * requestAnimationFrame. If time is > 10 years, we decide that this must be
                 * firefox, and adjust our epoch and all timings henceforth. */
                _this.epoch = now - 16; /* 1/60s, just because. */
            }

            now = now - _this.epoch;
            _this.now = now;

            _this.requestAnimationFrame(loop);

            _this.updateFX();
            _this.map.updateLayers(now);
            _this.updatePhasers();
            update(now - _this.lastFrameTime); /* This fn is in the game code */
            _this.updateSprites();
            if (_this.camera) {
                _this.camera.update(now);
            }
            draw(_this.ctx); /* This fn is also in the game code */
            if (_this.dbgShowRegions && _this.map!==undefined) {
                _this.map.drawDebugRegions(_this.ctx);
            }

            drawDebug();

            _this.lastFrameTime = _this.now;
        }

        preloader.load(

            /* Preloading complete */
            function() {

                /* Resolve the layers into handy image references */
                if (_this.map!==undefined) {
                    _this.map.resolveTiles();
                }

                /* Tell the game where we're at */
                if (typeof _this.game.onResourcesLoaded === 'function') {
                    _this.game.onResourcesLoaded();
                }

                /* Start the paint loop */
                setTimeout(function(){loop(0);}, 0);
            },

            /* Preloader progress */
            function(progress) {
                if (typeof _this.game.onProgress === 'function') {
                    _this.game.onProgress(progress, _this.ctx);
                }
            },

            /* Preloading failed */
            function() {
                if (typeof _this.game.onLoadError === 'function') {
                    _this.game.onLoadError();
                }
            }
        );

        /**
         * Test the keyboard to see if the user has pressed any bound keys
         * @method module:snaps.Snaps#actioning
         * @param  {String} action The name of the action to test
         * @return {Boolean} True if pressed.
         */
        this.actioning = function(action) {
            return _this.keyboard.actionPressed(action);
        };

        /* TODO: Rename scroll methods to better reflect the fact that it sets
         * the map position rather than animatedly scroll it. */

        /**
         * Scroll the map view by a given amount of pixels.
         * @method module:snaps.Snaps#scroll
         * @param  {Number} dx The number of pixels to scroll horizontally
         * @param  {Number} dy The number of pixels to scroll vertically
         */
        this.scroll = function(dx,dy) {
            _this.map.scroll(dx, dy);
        };

        /**
         * Sets the map position to center on a given world coordinate.
         * @method module:snaps.Snaps#scrollTo
         * @param  {Number} x The x position of the new map center.
         * @param  {Number} y The y position of the new map center.
         */
        this.scrollTo = function(x,y) {
            _this.map.scrollTo(x, y);
        };

        /** Gets an object describing the pixel limits of the world edges.
         * @method module:snaps.Snaps#getWorldEdges
         * @return {Object} Contains 4 properties, le, te, re and be which hold
         * the left, top, right and bottom edges respectively.
         */
        this.getWorldEdges = function() {
            return _this.map.getWorldEdges();
        };

        /** Call from your game draw function to draw the map, sprites, layers, fx etc
         * @method module:snaps.Snaps#drawWorld
         */
        this.drawWorld = function() {
            this.map.drawWorld(_this.ctx, _this.now, _this.sprites);
        };

        /** Get the mouse screen position
         * @method module:snaps.Snaps#mouseScreenPos
         * @param {Array} out An 2-length array that will recieve the xy values of
         * the mouse position in that order.
         */
        this.mouseScreenPos = function(out) {
            out[0] = _this.mouse.x;
            out[1] = _this.mouse.y;
        };

        /** Get the mouse world position
         * @method module:snaps.Snaps#mouseWorldPos
         * @param {Array} out An 2-length array that will recieve the xy values of
         * the mouse position in that order.
         */
        this.mouseWorldPos = function(out) {
            _this.map.screenToWorldPos(_this.mouse.x, _this.mouse.y, out);
        };

        /** Takes a world position and tells you what tile it lies on. Take
         * care with the return value, the function signature is all backwards.
         * @method module:snaps.Snaps#worldToTilePos
         * @param {Number} x A world x position
         * @param {Number} y A world y position
         * @param {Array} out A 2-length array that will recieve the tile x/y
         * position in its 0/1 values.
         * @return {Number} The distance from the given world position to the
         * closest tile edge, capped at 127px.
         */
        this.worldToTilePos = function(x, y, out) {
            return this.map.worldToTilePos(x,y, out);
        };

        /** Takes a screen position and tells you what tile it lies on. Take
         * care with the return value, the function signature is all backwards.
         * @method module:snaps.Snaps#screenToTilePos
         * @param {Number} x A screen x position
         * @param {Number} y A screen y position
         * @param {Array} out A 2-length array that will recieve the tile x/y
         * position in its 0/1 values.
         * @return {Number} The distance from the given screen position to the
         * closest tile edge, capped at 127px.
         */
        this.screenToTilePos = function(x, y, out) {
            return this.map.screenToTilePos(x,y, out);
        };

        /** Convert a screen position to a world position
         * @method module:snaps.Snaps#screenToWorldPos
         * @param {Array} out An 2-length array that will recieve the xy values of
         * the position in that order.
         */
        this.screenToWorldPos = function(x, y, out) {
            this.map.screenToWorldPos(x,y, out);
        };

        /** Convert a world position to a screen position
         * @method module:snaps.Snaps#worldToScreenPos
         * @param {Array} out An 2-length array that will recieve the xy values of
         * the position in that order.
         */
        this.worldToScreenPos = function(x, y, out) {
            this.map.worldToScreenPos(x,y, out);
        };

        /** Get a tile by it's row and column position in the original map data.
         * @method module:snaps.Snaps#getTile
         * @param  {Object} layer The layer to search for tiles.
         * @param  {Number} c The column, aka x position in the data.
         * @param  {Number} r the row, aka y position in the data.
         * @return {Object} A {@link  module:map/tile.Tile|Tile}, or null if the input was out of range.
         */
        this.getTile = function(layer, c, r) {
            return this.map.getTile(layer, c, r);
        };

        /** Get a tile by it's row and column position and find the world position
         * of its center point.
         * @method module:snaps.Snaps#getTileWorldPos
         * @param  {Number} c The column, aka x position in the data.
         * @param  {Number} r the row, aka y position in the data.
         * @return {Object} A tile, or null if the input was out of range.
         */
        this.getTileWorldPos = function(c, r, out) {
            this.map.tileDimensions(out);
            if ((r&1)===0) {
                out[0] = (c+1)*out[0] - (out[0]/2);
                out[1] = (r+1)*(out[1]/2);
            } else {
                out[0] = (c+1)*out[0];
                out[1] = (r+1)*(out[1]/2);
            }
        };

        /** Get a tile property from a world position. Starts at the topmost
         * map layer and world down to the ground.
         * @method module:snaps.Snaps#getTilePropAtWorldPos
         * @param  {String} prop The property to get
         * @param  {Number} x The x world position
         * @param  {Number} y The y world position
         * @return {String} The property or undefined.
         */
        this.getTilePropAtWorldPos = function(prop, x, y) {
            return this.map.getTilePropAtWorldPos(prop, x,y);
        };

        /** Get a tile property from a tile column and row in the original map data.
         * Starts at the topmost map layer and world down to the ground.
         * @method module:snaps.Snaps#getTilePropAtTilePos
         * @param  {String} prop The property to get
         * @param  {Number} x The x tile column position
         * @param  {Number} y The y tile row position
         * @return {String} The property or undefined.
         */
        this.getTilePropAtTilePos = function(prop, x, y) {
            return this.map.getTilePropAtTilePos(prop, x,y);
        };

        /**
         * Create a new collider for use in sprites.
         * @method module:snaps.Snaps#createCollider
         * @param  {String} type The name of the collider plugin
         * @param  {Object} opts Options to pass to the collider
         * @return {Object} A collider
         */
        this.createCollider = function(type, opts) {
            if(!_this.colliders.hasOwnProperty(type)) {
                throw "Warning: undefined collider plugin: " + type;
            }
            return new _this.colliders[type](opts);
        };


        /**
         * Create a new camera for use in game. Creating a camera does not
         * activate it. You need to then call {@link module:snaps.Snaps#switchToCamera|switchToCamera}.
         * @method module:snaps.Snaps#createCamera
         * @param  {String} name The name of the camera so that you can refer
         * to it again.
         * @param  {String} type The name of the camera plugin to instantiate.
         * @param  {Object} opts Options to pass to the camera
         * @return {Object} The new camera.
         */
        this.createCamera = function(name, type, opts) {
            if(!_this.cameraPlugins.hasOwnProperty(type)) {
                throw "Warning: undefined camera plugin: " + type;
            }

            if (this.cameras.hasOwnProperty(name)) {
                throw "Camera already exists: "+name;
            }

            this.cameras[name] = new _this.cameraPlugins[type](opts);
            return this.cameras[name];
        };

        /**
         * Switch to a previously created, named camera
         * @method module:snaps.Snaps#switchToCamera
         * @param  {String} name The name of the camera
         */
        this.switchToCamera = function(name) {
            this.camera = this.cameras[name];
        };

        /**
         * Spawn a new sprite in the world
         * @method module:snaps.Snaps#spawnSprite
         * @param {String} defName The name of the sprite definition to use. These are
         * set up in your game's spriteDefs data.
         * @param {String} stateName The initial state. This too is defined in the
         * sprite's definition, in your game's spriteDefs data.
         * @param {Number} x The world x coordinate. Can be a function which takes
         * no parameters and returns a number.
         * @param {Number} y The world y coordinate. Can be a function which takes
         * no parameters and returns a number.
         * @param {Number} h The height off the ground. Can be a function which takes
         * no parameters and returns a number.
         * @param {Object} [opts] Optional sprite parameters. For a list of parameters
         * see the opts parameter on the {@link module:sprites/sprite.Sprite|Sprite class constructor}.
         */
        this.spawnSprite = function(defName, stateName, stateExt, x, y, h, opts) {

            opts = opts||{};

            if (opts.id===undefined) {
                opts.id = uid();
            } else {
                if(_this.spriteMap.hasOwnProperty(opts.id)) {
                    throw "Error: duplicate sprite id " + opts.id;
                }
            }

            var s = Sprite.construct(_this, defName, stateName, stateExt, x, y, h, opts);

            _this.sprites.push(s);
            _this.spriteMap[opts.id] = s;

            return s;
        };

        /**
         * Spawn a new composite in the world
         * @method module:snaps.Snaps#createComposite
         * @param {Number} x The world x coordinate.
         * @param {Number} y The world y coordinate.
         * @param {String} id A unique ID so you can find the composite again.
         * @param {Object} [endCallback] Once the composite and all its child sprites expire,
         * this is called.
         */
        this.createComposite = function(x,y,id,endCallback) {

            if (id===undefined) {
                id = 'id'+uid();
            } else {
                if(_this.spriteMap.hasOwnProperty(id)) {
                    throw "Warning: duplicate sprite (composite) id " + id;
                }
            }

            var comp = new Composite(this, x, y, id, endCallback);
            comp.init();
            _this.sprites.push(comp);
            _this.spriteMap[id] = comp;
            return comp;
        };

        /** Marks a time in the future for a timer to trigger. Timers are
         * not events driven by the engine, but rather need to be explicitely
         * checked in a timely fashion by the game, via {@link module:snaps.Snaps#markTime|checkTimer}.
         * @method module:snaps.Snaps#markTime
         * @param {String} name A name for the timer. Use this to check the timer later.
         * @param {Number} time When to set the timer for in ms. E.g. 1000 == 1s in the future.
         */
        this.markTime = function(name, time) {
            _this.timers[name] = _this.now + time;
        };

        /** Checks to see if a timer set with markTime has passed.
         * @method module:snaps.Snaps#checkTimer
         * @param {String} name The name of the timer to check.
         * @param {Number} [resetMs] If omitted, the timer will be removed. If
         * present, the timer will be reset, adding resetMs to its current
         * expired trigger time.
         * @return {Boolean} true if the timer has triggered. Note that an immediate
         * call to checkTimer again will return false - The true value is
         * only returned once unless the timer is reset.
         */
        this.checkTimer = function(name, resetMs) {
            if (_this.timers[name]===undefined) {
                /* This timer has already returned true and been deleted. They only work once. */
                return false;
            }
            var mark = _this.timers[name];
            var dt = _this.now - mark;
            if (dt>0) {
                if (resetMs===undefined) {
                    delete _this.timers[name];
                } else {
                    resetMs = Math.max(1, resetMs);
                    do {
                        mark+=resetMs;
                    }while(mark<_this.now);
                    _this.timers[name] = mark;
                }
                return true;
            }
            return false;
        };

        /** Find a sprite on the stage by ID
         * @method module:snaps.Snaps#sprite
         * @param {String} sprite The name of the sprite to get.
         * @return {Object} A sprite, or undefined
         */
        this.sprite = function(sprite) {
            return _this.spriteMap[sprite];
        };

        /**
         * @method module:snaps.Snaps#updateSprites
         * @private
         */
        this.updateSprites = function() {
            var epoch = +new Date();
            var keepsprites = [];
            var i, s;
            for (i = 0; i < _this.sprites.length; i++) {
                s = _this.sprites[i];
                if (s.isActive(_this.now)) {
                    s.update(_this.now);
                    keepsprites.push(s);
                } else {
                    s.onRemove();
                    delete _this.spriteMap[s.name];
                }
            }
            _this.sprites = keepsprites;

            for (i = 0; i < _this.sprites.length; i++) {
                s = _this.sprites[i];
                s.commit(_this.now);
            }
            this.stats.count('updateSprites', (+new Date())-epoch);
        };

        /**
         * The current frame time, updated at the start of each loop
         * @method module:snaps.Snaps#getNow
         * @return {Number} The current frame time.
         */
        this.getNow = function() {
            return _this.now;
        };

        /**
         * Spawn a new phaser for use in sprite updates
         * @method module:snaps.Snaps#createPhaser
         * @param {String} name The name of the phaser plugin to instantiate.
         * @param {Object} [opts] Optional values passed to the phaser.
         */
        this.createPhaser = function(name, opts) {
            if (!_this.phaserPlugins.hasOwnProperty(name)) {
                throw "Can't create phaser for unregistered type: " + name;
            }

            var phaser = new _this.phaserPlugins[name]('id'+uid(), opts);
            _this.phasers.push(phaser);
            return phaser;
        };

        /**
         * Call this when the canvas is resized in the browser.
         * @method module:snaps.Snaps#resizeCanvas
         */
        this.resizeCanvas = function() {

            var c = document.getElementById(canvasID);
            this.clientWidth = c.clientWidth;
            this.clientHeight = c.clientHeight;

            _this.map.onResize(c.clientWidth, c.clientHeight);
        };
    }

    /**
     * The contents of the util/* modules are exposed here for general use.
     * @member module:snaps.Snaps#util
     * @type {Object}
     */
    Snaps.util = util;

    return Snaps;
});
