/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/uid
     */

    var next = 1;

    /**
     * Generates unique IDs
     * @function module:util/uid#uid
     * @return {Number} A unique ID
     */
    return function() {
        return next++;
    };

});
