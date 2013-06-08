/*global define*/
define(function() {

    /**
     * @module input/ui/button
     */

    'use strict';

    /** A button reacts to mouse and touch events. It should be added to a panel
     * in order to be presented on-screen.
     * @constructor module:input/ui/button.Button
     */
    function Button(sn) {
        this.sn            = sn;
        this.x             = 0;
        this.y             = 0;
        this.sprite        = undefined;

        this.inactiveState = 'inactive';
        this.activeState   = 'active';
        this.hoverState    = 'hover';
        this.disabledState = 'disabled';
    }

    /**
     * Draw the button to the screen.
     * @method module:input/ui/button.Button#draw
     * @private
     */
    Button.prototype.draw = function(ctx, offsetx, offsety, now) {
        /*(void)*/this.sprite.isActive(now); /* This sets the internal active flag on the sprite */
        this.sprite.draw(ctx, offsetx-this.x, offsety-this.y, now);
    };


    return Button;
});
