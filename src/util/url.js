/*global define*/
define(function() {

    'use strict';

    /**
     * @module util/url
     */

    return {
        /**
         * Extracts query string values from the current window's URL
         * @function module:util/url#queryStringValue
         * @param {String} name The query string name
         * @return {String} The query string value, or null
         */
        queryStringValue: function(name)
        {
            var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        }
    };

});
