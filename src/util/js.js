define(function() {

    'use strict';

    /** Convert a click event position (event.pageX/Y) into coords relative
     * to a canvas.
     */
    HTMLCanvasElement.prototype.relCoords = function(x,y,out){

        /* TODO: Doesn't the mouse handler do this too? Consolidate this code. */
        var rect = this.getBoundingClientRect();
        out[0] = x - rect.left - window.pageXOffset;
        out[1] = y - rect.top - window.pageYOffset;
    };

    return {

        copyProps: function(s,d) {
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        },

        clone: function(s) {
            var d = {};
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        }

    };

});
