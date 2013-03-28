/*global define,describe,expect,it*/
define('spec/simplegame', ['snaps'], function(Snaps) {

    /* The game */

    function SimpleGame() {

    }

    /* The tests */

    describe('Game', function() {

        it('should have default settings', function() {
            expect(function() {
                var game = new SimpleGame();
                var sn = new Snaps(game, 'canvas');
            }).to.not.throws(Error);
        });
    });

});
