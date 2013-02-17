define(function() {

    'use strict';

    return {
        queryStringValue: function(name)
        {
            var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
            return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
        }
    };

});
