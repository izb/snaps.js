/*global define*/
define(function() {

    'use strict';

    var next = 1;

    /* TODO: This is a uid, not a guid. */

    /** Return a unique string for identifier purposes.
     */
    return function() {
        return 'id'+(next++);
    };

});
