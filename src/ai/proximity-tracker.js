/*global define*/
define(function() {

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
     * This constructor is curried when exposed through {@link module:snaps.Snaps#ProximityTracker|the engine ref},
     * which is the prefered way to create it. This means construct it without the first parameter, e.g.
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

        this.cellw = cellSize;
        this.cellh = cellSize/2;

        this.sn    = sn;

        var edges  = sn.getWorldEdges();

        this.le    = edges.le;
        this.re    = edges.re;
        this.te    = edges.te;
        this.be    = edges.be;

        var h      = this.be-this.te;
        var w      = this.re-this.le;
        this.span  = w;

        h          = Math.ceil(h / this.cellh);
        w          = Math.ceil(w / this.cellw);

        this.cells = new Array(h*w);

        this.id    = sn.util.uid();

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
            var cache       = this.candidateCache[r];
            this.certains   = cache.certains;
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
            this.certains   = [];
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
        var c  = cy*this.span+cx;

        /* Cells that are certain to be within the radius are easy */
        for (i = this.certains.length - 1; i >= 0; i--) {
            oc = c+this.certains[i];
            if (oc>=0 && oc<this.cells.length) {
                cell = this.cells[oc];
                if (cell!==undefined) {
                    if (sort===true) {
                        /* Store distances in the sprite for sorting later */
                        for (j = cell.sprites.length - 1; j >= 0; j--) {
                            s  = cell.sprites[j];
                            dx = x-s.x;
                            dy = (y-s.y)*2;
                            /* TODO: Sprites should declare a working area property to avoid deoptimization here. */
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
                        s  = cell.sprites[j];
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

        var x  = (sprite.x/this.cellw)|0;
        var y  = (sprite.y/this.cellh)|0;
        var c  = y*this.span+x;

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
