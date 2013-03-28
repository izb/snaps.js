/*global define,describe,expect,it*/
define('spec/simplegame', ['snaps', 'map'], function(Snaps, map) {

    /* The game */

    function SimpleGame() {
        this.map = map;

        this.hitTests = {
            hit: 'maps/hitmaps/tile.png'
        };
    }

    /* The tests */

    describe('Game', function() {

        var game, sn, ex;
        try {
            game = new SimpleGame();
            sn = new Snaps(game, 'canvas');
        } catch(e) {
            /* Oh dear */
            ex = e;
        }

        it('should have loaded a map into the engine', function() {
            /* If snaps through an exception on startup, sn will be
             * undefined */
            expect(ex).to.be.undefined;
        });

        it('should have correct initial map boundaries', function() {
            var edges = sn.getWorldEdges();

            expect(edges).to.deep.equal({
                le:96,
                te:48,
                re:5759,
                be:2879
            });
        });
    });

});
