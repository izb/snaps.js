/*global define,describe,expect,it,console*/
define('spec/pathfinding', ['snaps'], function(Snaps) {

    var logGrids = false;

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
            orientation:'orthogonal',
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

        var isSolid = function(grid,x,y) {
            return grid.charAt(x+10*y)==='#';
        };

        var drawGrid = function(name, grid) {
            console.log(name);
            for (var i = 0; i < grid.length; i+=10) {
                console.log(grid.substr(i,10));
            }
        };

        var plotRoute = function(grid, route) {
            for (var i = 0; i < route.length; i+=2) {
                var index = route[i]+route[i+1]*10;
                grid = grid.substr(0, index) + 'O' + grid.substr(index+1);
            }
            return grid;
        };

        it('should find its way diagonally in an empty room', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */

            var grid = ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       "..........";


            var pf = new sn.PathFinder(true, isSolid.bind(this,grid));

            var route = pf.route(0,0,9,9);

            var routeGrid = plotRoute(grid, route);

            if (logGrids) {
                drawGrid("Before", grid);
                drawGrid("After", routeGrid);
            }

            expect(routeGrid).to.equal(
                "O........." +
                ".O........" +
                "..O......." +
                "...O......" +
                "....O....." +
                ".....O...." +
                "......O..." +
                ".......O.." +
                "........O." +
                ".........O");

        });

        it('should find its way diagonally back again in an empty room', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */

            var grid = ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       "..........";


            var pf = new sn.PathFinder(true, isSolid.bind(this,grid));

            var route = pf.route(9,9,0,0);

            var routeGrid = plotRoute(grid, route);

            if (logGrids) {
                drawGrid("Before", grid);
                drawGrid("After", routeGrid);
            }

            expect(routeGrid).to.equal(
                "O........." +
                ".O........" +
                "..O......." +
                "...O......" +
                "....O....." +
                ".....O...." +
                "......O..." +
                ".......O.." +
                "........O." +
                ".........O");

        });

        it('should find its way diagonally without diagonal movements in an empty room', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */

            var grid = ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       "..........";


            var pf = new sn.PathFinder(false, isSolid.bind(this,grid));

            var route = pf.route(0,0,9,9);

            var routeGrid = plotRoute(grid, route);

            if (logGrids) {
                drawGrid("Before", grid);
                drawGrid("After", routeGrid);
            }

            expect(routeGrid).to.equal(
                "O........." +
                "OOO......." +
                "..OO......" +
                "...OOO...." +
                ".....O...." +
                ".....O...." +
                ".....O...." +
                ".....O...." +
                ".....OOO.." +
                ".......OOO");

        });

        it('should find its way across an empty room', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */

            var grid = ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       "..........";


            var pf = new sn.PathFinder(true, isSolid.bind(this,grid));

            var route = pf.route(0,5,9,5);

            var routeGrid = plotRoute(grid, route);

            if (logGrids) {
                drawGrid("Before", grid);
                drawGrid("After", routeGrid);
            }

            expect(routeGrid).to.equal(
                ".........." +
                ".........." +
                ".........." +
                ".........." +
                ".........." +
                "OOOOOOOOOO" +
                ".........." +
                ".........." +
                ".........." +
                "..........");

        });

        it('should find its way out of a box and round the back', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */

            var grid = ".........." +
                       ".........." +
                       ".###.###.." +
                       ".#.....#.." +
                       ".#.....#.." +
                       ".#.....#.." +
                       ".#.....#.." +
                       ".#######.." +
                       ".........." +
                       "..........";


            var pf = new sn.PathFinder(true, isSolid.bind(this,grid));

            var route = pf.route(3,6,6,9);

            var routeGrid = plotRoute(grid, route);

            if (logGrids) {
                drawGrid("Before", grid);
                drawGrid("After", routeGrid);
            }

            expect(routeGrid).to.equal(
                ".........." +
                ".....OOO.." +
                ".###O###O." +
                ".#.O...#O." +
                ".#.O...#O." +
                ".#.O...#O." +
                ".#.O...#O." +
                ".#######O." +
                ".......O.." +
                "......O...");

        });

        it('should find its way out of a small box and round the side', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */

            var grid = ".........." +
                       ".........." +
                       ".#### #..." +
                       ".#....#..." +
                       ".#....#..." +
                       ".######..." +
                       ".........." +
                       ".........." +
                       ".........." +
                       "..........";


            var pf = new sn.PathFinder(true, isSolid.bind(this,grid));

            var route = pf.route(2,4,0,4);

            var routeGrid = plotRoute(grid, route);

            if (logGrids) {
                drawGrid("Before", grid);
                drawGrid("After", routeGrid);
            }

            expect(routeGrid).to.equal(
                ".........." +
                ".OOOO....." +
                "O####O#..." +
                "O#..O.#..." +
                "O#OO..#..." +
                ".######..." +
                ".........." +
                ".........." +
                ".........." +
                "..........");

        });


        it('should not find its way through a wall', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */

            var grid = ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       "##########" +
                       ".........." +
                       ".........." +
                       ".........." +
                       ".........." +
                       "..........";


            var pf = new sn.PathFinder(true, isSolid.bind(this,grid));

            var route = pf.route(3,0,6,9);

            var routeGrid = plotRoute(grid, route);

            if (logGrids) {
                drawGrid("Before", grid);
                drawGrid("After", routeGrid);
            }

            expect(routeGrid).to.equal(
                ".........." +
                ".........." +
                ".........." +
                ".........." +
                "##########" +
                ".........." +
                ".........." +
                ".........." +
                ".........." +
                "..........");

        });


        it('should find its way through a labyrinth', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */

            var grid = ".#.#.#.#.." +
                       ".#.#...#.#" +
                       ".#.#.#.#.." +
                       ".#.#.#.#.." +
                       ".#...#.##." +
                       ".#.#.#.##." +
                       ".#.#.#.#.." +
                       "...#.#.#.." +
                       ".#.#.#...." +
                       ".#...#.#..";


            var pf = new sn.PathFinder(true, isSolid.bind(this,grid));

            var route = pf.route(0,0,9,0);

            var routeGrid = plotRoute(grid, route);

            if (logGrids) {
                drawGrid("Before", grid);
                drawGrid("After", routeGrid);
            }

            expect(routeGrid).to.equal(
                "O#.#.#.#.O" +
                "O#.#.O.#O#" +
                "O#.#O#O#.O" +
                "O#.#O#O#.O" +
                "O#.O.#O##O" +
                "O#O#.#O##O" +
                "O#O#.#O#O." +
                ".O.#.#O#O." +
                ".#.#.#.O.." +
                ".#...#.#..");

        });
    });

});
