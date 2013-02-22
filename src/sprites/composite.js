define(function() {

    'use strict';

    function Composite(sn, x, y, h, endCallback) {
        this.sn = sn;
        this.x = x;
        this.y = y;
        this.h = h;
        this.endCallback = endCallback;
        this.active = true;
        this.sprites = [];
    }

    Composite.prototype.init = function() {
        /* TODO: Initialize composite plugins */
    };

    Composite.prototype.isActive = function(now) {

        if (!this.active) {
            return false;
        }

        var isactive = false;

        for (var i = this.sprites.length - 1; i >= 0; i--) {
            var s = this.sprites[i];
            if (s.isActive()) {
                isactive = true;
            } else {
                this.sprites.splice(i,1);
            }
        }

        this.active = isactive;

        if (!this.active && this.endCallback !== undefined) {
            this.endCallback();
        }

        return isactive;
    };

    Composite.prototype.update = function() {
        /* TODO: Call composite plugins */
    };

    Composite.prototype.draw = function(ctx, screenx, screeny, now) {
        if (!this.active) {
            /* This may have been set by prior call to update, so check here */
            return;
        }

        /* Composite's position. */
        var x = this.x - screenx - this.def.x;
        var y = this.y - screeny - this.def.y - this.h;

        for (var i = 0; i < this.sprites.length; i++) {
            var s = this.sprites[i];

            /* For sprites in a composite, the x/y position is relative to the
             * composite screen position. The height is ignored. */
            s.drawAt(ctx, x + s.x, y + s.y, now);
        }
    };

    return Composite;

});
