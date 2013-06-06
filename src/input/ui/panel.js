/*global define*/
define(function() {

    /**
     * @module input/ui/panel
     */

    'use strict';

    /** A panel represents a set of UI elements which are drawn in order
     * to the screen. E.g. a popup dialog panel that contains labels and
     * buttons.
     * @constructor module:input/ui/panel.Panel
     */
    function Panel(sn) {
        this.sn = sn;
    }

    /**
     * Panels can be defined in your game as JSON data. Call this static
     * factory method to create a panel hierarchy from a JSON description.
     * @member module:input/ui/panel.Panel#load
     * @static
     * @param {Object} data A JSON data structure that describes a nested
     * UI arrangement with a root panel.
     * @return {Panel} A new panel.
     */
    Panel.load = function(data) {
        /* TODO */
        return this;
    };

    /**
     * Show this panel on-screen.
     * @member module:input/ui/panel.Panel#show
     * @param  {Boolean} [doShow=true] Pass true to show or false to hide.
     */
    Panel.prototype.show = function(doShow) {
        if (doShow===undefined) {
            doShow = true;
        }
        /* TODO */

        return this;
    };

    /**
     * Hide this panel.
     * @member module:input/ui/panel.Panel#hide
     */
    Panel.prototype.hide = function() {
        this.show(false);
        return this;
    };

    /**
     * Moves this panel to the center of the screen. Only works on the root
     * panel if it has dimensions set. In all other cases, the behaviour is
     * undefined.
     * @member module:input/ui/panel.Panel#center
     * @param  {Boolean} [cy=true] Pass true to center vertically.
     * @param  {Boolean} [cx=true] Pass true to center horizontally.
     */
    Panel.prototype.center = function(cy, cx) {
        if (cy===undefined) {
            cy = true;
        }

        if (cx===undefined) {
            cx = true;
        }

        /* TODO: Move to the screen center */
        return this;
    };

    /**
     * Draws this panel. This will be called on every frame.
     * @param  {CanvasRenderingContext2D} ctx Drawing context
     * @private
     */
    Panel.prototype.draw = function(ctx) {
        /* TODO */
    };

    /* TODO: Panels should render off-screen so we can do transition in/out effects like
     * fade. This implies that the root panel in the data should have dimensions. */

    return Panel;
});
