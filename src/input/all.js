/*global define*/
define([
    'input/keyboard',
    'input/mouse',
    'input/ui/panel',
    'input/ui/button'],
function(Keyboard, Mouse, Panel, Button) {

    'use strict';

    /**
     * @module input/all
     * @private
     */

    return {
        Keyboard: Keyboard,
        Mouse:    Mouse,
        Panel:    Panel,
        Button:   Button
    };

});
