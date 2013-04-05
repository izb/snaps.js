/*global define*/
define(function() {

    function Node(x,y) {
        this.x = x;
        this.y = y;
        this.score = 0;
    }

    function PathFinder(sn, diagonals, solid) {

        this.sn = sn;
        this.ground = sn.map.groundLayer();
        this.xcount = sn.map.data.width;
        this.ycount = sn.map.data.height;
        this.nodeRows = new Array(this.ycount);

        for (var i = this.nodeRows.length - 1; i >= 0; i--) {
            this.nodeRows[i] = new Array(this.xcount);
        }

        var r2=Math.sqrt(2);

        this.xdirections = diagonals?[1,  1, 0, -1, -1, -1,  0,  1]:[1, 0, -1,  0];
        this.ydirections = diagonals?[0,  1, 1,  1,  0, -1, -1, -1]:[0, 1,  0, -1];
        this.distances   = diagonals?[1, r2, 1, r2,  1, r2,  1, r2]:[1, 1,  1, -1];

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

            return path;
        };
    }

    var distance2 = function(x0,y0,x1,y1) {
        var dx = x1-x0;
        var dy = y1-y0;
        return (dx*dx)+(dy*dy);
    };

    PathFinder.prototype.route = function(x0,y0,x1,y1) {

        var i;

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

            for (i = this.xdirections.length - 1; i >= 0; i--) {
                var xd = this.xdirections[i];
                var yd = this.ydirections[i];
                var neighbour = this.node(current.x+xd,current.y+y0);
                if (neighbour===null) {
                    /* Can't move that way. */
                    continue;
                }

                var tscore = current.score + this.distances[i];
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
