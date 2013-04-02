/*global define*/
define(function() {

    /**
     * This constructor is magically bound when exposed through the engine ref,
     * so construct it without the first parameter, e.g.
     * new sn.ProximityTracker(myCellSize);
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

        this.candidateCache[r] = {
            certains: this.certains,
            uncertains: this.uncertains
        };
    };

    /** Finds the sprites nearest a point. Ignores height.
     * @param {Number} x The x world position of the test point
     * @param {Number} y The y world position of the test point
     * @param {Number} r The radius to search. Note that although this is
     * in pixels, it is horizontal pixels. The search area will be an ellipse
     * to account for the isometric projection.
     * @return {Array} An array of sprites that fall within the search area.
     */
    ProximityTracker.prototype.find = function(x,y,r) {

        setCurrentCandidateCells.call(this, r);

        var i, j, oc, cell, s;

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
                    for (j = cell.sprites.length - 1; j >= 0; j--) {
                        s = cell.sprites[j];
                        s.ct='green';
                    }

                    found = found.concat(cell.sprites);
                }
            }
        }

        /* Cells that are not certain to be within the radius must have
         * every distance tested */
        var r2 = r*r;
        for (i = this.uncertains.length - 1; i >= 0; i--) {
            oc = c+this.uncertains[i];
            if (oc>=0 && oc<this.cells.length) {
                cell = this.cells[oc];
                if (cell!==undefined) {
                    for (j = cell.sprites.length - 1; j >= 0; j--) {
                        s = cell.sprites[j];
                        var dx = x-s.x;
                        var dy = (y-s.y)*2;
                        if((dx*dx+dy*dy)<=r2) {
                            s.ct='red';
                            found.push(s);
                        }
                    }
                }
            }
        }

        return found;
    };

    /** Use this in conjunction with the track plugin. Add it to the list of sprite
     * updaters on your tracked sprites, after the sprite has moved. E.g.
     *
     * updates:[{
     *     name: 'some-sprite-moving-plugin'
     * }, {
     *     name:'track',
     *     fn: myProximityTracker.track.bind(myProximityTracker),
     *     register: myProximityTracker.register.bind(myProximityTracker),
     *     deregister: myProximityTracker.unregister.bind(myProximityTracker)
     * }]
     */
    ProximityTracker.prototype.track = function(sprite) {
        var pd = sprite.proximityData[this.id];

        var x = (sprite.x/this.cellw)|0;
        var y = (sprite.y/this.cellh)|0;
        var c = y*this.span+x;
        if (this.cells[c]===undefined) {
            this.cells[c] = {
                sprites:[sprite]
            };
            pd.cell = c;
        } else if(c!==pd.cell) {
            removeFromItsCell.call(this, sprite);
            this.cells[c].sprites.push(sprite);
            pd.cell = c;
        }

    };

    ProximityTracker.prototype.register = function(sprite) {
        sprite.proximityData = {};
        sprite.proximityData[this.id] = {cell: undefined};
        this.track(sprite);
    };

    ProximityTracker.prototype.unregister = function(sprite) {
        removeFromItsCell.call(this, sprite);
        delete sprite.proximityData[this.id];
    };

    return ProximityTracker;

});
