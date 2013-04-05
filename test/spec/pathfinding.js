/*global define,describe,expect,it*/
define('spec/pathfinding', ['snaps'], function(Snaps) {

    /* Dummy game */
    function PathFinding() {
        /* Some dummy map data */
        this.map = {
            tilewidth:192,
            tileheight:96,
            tilesets: [],
            layers:[{
                "data":Array.apply(null, new Array(100)).map(Number.prototype.valueOf,0),
                "height":10,
                "name":"ground",
                "opacity":1,
                "type":"tilelayer",
                "visible":true,
                "width":10,
                "x":0,
                "y":0
            }],
            width:10,
            height:10
        };

        this.hitTests = {
            hit: 'maps/hitmaps/tile.png'
        };

        this.update = function(timeSinceLastFrame) {
        };

        this.draw = function(ctx) {
        };

    }

    /* The tests */

    describe('Pathfinder', function() {

        var game, sn, ex;
        try {
            game = new PathFinding();
            sn = new Snaps(game, 'canvas');
        } catch(e) {
            /* Oh dear */
            ex = e;
        }

        it('should find its way in an empty room', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */
            var pf = new sn.PathFinder(true, function(x,y) {
                /* Nothing is solid */
                return false;
            });

            var route = pf.route(0,0,9,9);

            expect(route.length).to.equal(20);

        });

    });

});
