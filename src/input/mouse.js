/*global define*/
define(function() {

    /**
     * @module input/mouse
     */

    'use strict';

    /** Creates a mouse input handler and starts listening for
     * mouse events. You don't normally need to create this since the engine
     * creates one by default.
     * @constructor module:input/mouse.Mouse
     * @param {HTMLCanvasElement} canvas Mouse position will be
     * relative to and constrained to the limits of the given canvas.
     */
    function Mouse(canvas) {

        var _this = this;

        /**
         * The mouse X position, relative to the left-hand-edge of the canvas.
         * @type {Number}
         * @member module:input/mouse.Mouse#x
         */
        this.x = 0;

        /**
         * The mouse Y position, relative to the top of the canvas.
         * @type {Number}
         * @member module:input/mouse.Mouse#y
         */
        this.y = 0;

        this.inputmap = {
            mouse1: -1,
            mouse2: -3,
            wheelUp: -4,
            wheelDown: -5
        };

        var mousemoved = function(e) {
            var rect = canvas.getBoundingClientRect();
            _this.x = e.clientX - rect.left;
            _this.y = e.clientY - rect.top;
        };

        canvas.addEventListener('mousemove', mousemoved, false);

    }

    return Mouse;

});
