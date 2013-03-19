define(function() {

    function UpdatePhaser(phases) {
        this.phases = phases;
    }

    UpdatePhaser.prototype.phase = function(now) {
        return true;
    };
    /* TODO */

    return UpdatePhaser;

});
