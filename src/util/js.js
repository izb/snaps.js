define(function() {

    'use strict';

    /** Convert a click event position (event.pageX/Y) into coords relative
     * to a canvas.
     */
    HTMLCanvasElement.prototype.relCoords = function(x,y){

        var rect = this.getBoundingClientRect();
        return {
            x: x - rect.left - window.pageXOffset,
            y: y - rect.top - window.pageYOffset
        };
    };

    return {

        copyProps: function(s,d) {
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        }

    };

});
