/*global define*/
define(function() {

    'use strict';

    var next = 1;

    /** Return a unique string for identifier purposes.
     */
    return function() {
        return 'id'+(next++);
    };

});
