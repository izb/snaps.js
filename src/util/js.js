/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/js
     */

    /** Convert a click event position (event.pageX/Y) into coords relative
     * to a canvas.
     * @private
     */
    HTMLCanvasElement.prototype.relCoords = function(x,y,out){

        /* TODO: Doesn't the mouse handler do this too? Consolidate this code. */
        var rect = this.getBoundingClientRect();
        out[0] = x - rect.left - window.pageXOffset;
        out[1] = y - rect.top - window.pageYOffset;
    };

    return {

        /**
         * Copy properties from one object to another
         * @function module:util/js#copyProps
         * @param {Object} s The source object
         * @param {Object} d The destination object
         * @return {Object} The destination object
         */
        copyProps: function(s,d) {
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        },

        /**
         * Copy properties from one object to another, but only if the destination
         * does not have those properties, or if it has undefined values.
         * @function module:util/js#setProps
         * @param {Object} s The source object
         * @param {Object} d The destination object
         * @return {Object} The destination object
         */
        setProps: function(s,d) {
            for (var prop in s) {
                if (s.hasOwnProperty(prop) && (!d.hasOwnProperty(prop) || d[prop]===undefined)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        },

        /**
         * Create a shallow clone of an object
         * @function module:util/js#clone
         * @param {Object} s The source object
         * @return {Object} A new copy of the object
         */
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
