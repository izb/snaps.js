/*global define*/
define([
    'input/keyboard',
    'input/mouse',
    'input/ui/panel',
    'input/ui/label',
    'input/ui/button'],
function(Keyboard, Mouse, Panel, Label, Button) {

    'use strict';

    /**
     * @module input/all
     * @private
     */

    return {
        Keyboard: Keyboard,
        Mouse:    Mouse,
        Panel:    Panel,
        Label:    Label,
        Button:   Button
    };

});
