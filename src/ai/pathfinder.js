/*global define*/

define(function() {

    'use strict';

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


    /** This constructor is curried when exposed through {@link module:snaps.Snaps#PathFinder|the engine ref},
     * which is the prefered way to create it. This means construct it without the first parameter, e.g.
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
     * @param {Boolean} [widen=false] Widens the route by expanding the path on diagonal
     * movements (n,s,e and w on isometric maps). Note that this modifies the passed in
     * route array by adding new tiles onto the end as well as returning a larger
     * set of output. The tiles in the route will no longer be usable in any sequential
     * order.
     * @return {Array} The transformed route
     */
    var transformRoute = function(route, nesw, span, widen) {
        if (route.length<=2) {
            return [];
        }

        var map = this.sn.map;
        var columns = map.columns;
        var newroute = new Array(route.length/2-1);
        var newrouteext = [];
        var i, tid;

        widen = !!widen;

        /* In nesw:
         * 0   1   2   3   4   5   6   7
         * n  ne   e  se   s  sw   w  nw  */

        if (widen) {
            var visited = {};
            var lastout = -1;
            for (i = route.length - 2; i >= 0; i-=2) {
                /* why do we calculate a tile id rather than store id's in the tile objects? because
                 * the map can have holes which the game can treat as non-solid tiles if it wishes, and
                 * there may be multiple tiles layered on top of each position. */
                tid = route[1]*columns+route[0];
                visited[tid] = 0;
            }
        }

        var enwidenStaggered = function(nextout, tilex, tiley) {
            if (lastout===-1) {
                lastout = nextout;
                return;
            }

            if (lastout===nextout) {
                route.push(tilex, tiley-2);
                newrouteext.push.apply(newrouteext, nesw.slice(0, span));
            } else {

            }
        };

        if(map.isStaggered()) {
            /* Route is 1D array arranged as x,y,x,y,x,y... We start 4 from the end and look
             * 1 pair ahead of the current pair to determine direction. */
            for (i = route.length - 4; i >= 0; i-=2) {
                var x0 = route[i];
                var y0 = route[i+1];
                var dx = x0-route[i+2];
                var dy = y0-route[i+3];
                var cut = [span*i/2, span];

                /* If you're browsing this code and start to feel some sort of rage when you see
                 * the logic wrapped up in these ternary operators wrapped up in a switch statement,
                 * then I'm genuinely sorry. I do however find this sort of thing strangely beautiful.
                 * If it helps, here's a top tip that explains that !== is the same as xor:
                 * http://stackoverflow.com/a/4540443/974 */

                switch(dy) {
                    case -2:
                        /* n */
                        if (widen) {
                            enwidenStaggered(0, x0, y0);
                        }
                        newroute.splice.apply(newroute, cut.concat(nesw.slice(0, span)));
                        break;
                    case -1:
                        if ((dx===0)!==((y0&1)!==0)) {
                            /* nw */
                            if (widen) {
                                enwidenStaggered(7, x0, y0);
                            }
                            newroute.splice.apply(newroute, cut.concat(nesw.slice(7*span, 8*span)));
                        } else {
                            /* ne */
                            if (widen) {
                                enwidenStaggered(1, x0, y0);
                            }
                            newroute.splice.apply(newroute, cut.concat(nesw.slice(1*span, 2*span)));
                        }
                        break;
                    case 0:
                        if (dx===1) {
                            /* e */
                            if (widen) {
                                enwidenStaggered(2, x0, y0);
                            }
                            newroute.splice.apply(newroute, cut.concat(nesw.slice(2*span, 3*span)));
                        } else {
                            /* w */
                            if (widen) {
                                enwidenStaggered(6, x0, y0);
                            }
                            newroute.splice.apply(newroute, cut.concat(nesw.slice(6*span, 7*span)));
                        }
                        break;
                    case 1:
                        if ((dx===0)!==((y0&1)!==0)) {
                            /* sw */
                            if (widen) {
                                enwidenStaggered(5, x0, y0);
                            }
                            newroute.splice.apply(newroute, cut.concat(nesw.slice(5*span, 6*span)));
                        } else {
                            /* se */
                            if (widen) {
                                enwidenStaggered(3, x0, y0);
                            }
                            newroute.splice.apply(newroute, cut.concat(nesw.slice(3*span, 4*span)));
                        }
                        break;
                    default:
                        /* s */
                        if (widen) {
                            enwidenStaggered(4, x0, y0);
                        }
                        newroute.splice.apply(newroute, cut.concat(nesw.slice(4*span, 5*span)));
                        break;
                }
            }
        } else {
            throw "Unsupported map orientation in routeToDirections/routeToVectors: "+map.type;
        }
        if (newrouteext.length>0) {
            newroute.push.apply(newroute, newrouteext);
        }

        return newroute;
    };


    /** Takes a route generated by {@link module:ai/pathfinder.PathFinder#route|route}
     * and creates a set of normalized vectors along the route that can be used
     * to influence movement.
     * @method module:ai/pathfinder.PathFinder#routeToVectors
     * @param {Array} route Route in the form returned by
     * {@link module:ai/pathfinder.PathFinder#route|route}.
     * @param {Boolean} [widen=false] Widens the route by expanding the path on diagonal
     * movements (n,s,e and w on isometric maps). Note that this modifies the passed in
     * route array by adding new tiles onto the end as well as returning a larger
     * set of output. The tiles in the route will no longer be usable in any sequential
     * order.
     * @return {Array} A spanned array of 2D vectors in the form x,y,x,y,x,y...
     */
    PathFinder.prototype.routeToVectors = function(route, widen) {
        return transformRoute.call(this,route,
            [ 0, -1,  // n
              1, -1,  // ne
              1,  0,  // e
              1,  1,  // se
              0,  1,  // s
             -1,  1,  // sw
             -1,  0,  // w
             -1, -1], // ne
            2, widen);
    };

    /** Takes a route generated by {@link module:ai/pathfinder.PathFinder#route|route}
     * and creates a set of compass directions along the rotue that can be used
     * to set directional state extensions in sprites.
     * @method module:ai/pathfinder.PathFinder#routeToDirections
     * @param {Array} route Route in the form returned by
     * {@link module:ai/pathfinder.PathFinder#route|route}.
     * @param {Boolean} [widen=false] Widens the route by expanding the path on diagonal
     * movements (n,s,e and w on isometric maps). Note that this modifies the passed in
     * route array by adding new tiles onto the end as well as returning a larger
     * set of output. The tiles in the route will no longer be usable in any sequential
     * order.
     * @return {Array} An array of directions, e.g. <code>['e', 'se', 's']</code>
     */
    PathFinder.prototype.routeToDirections = function(route, widen) {
        return transformRoute.call(this,route, ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'], 1, widen);
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
