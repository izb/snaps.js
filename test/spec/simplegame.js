define('test/simplegame', ['jquery', 'main/main'], function($, run) {

    function SimpleGame() {

    }

    describe('main', function() {

        new Snaps(new SimpleGame(), 'canvas');

    });

});
