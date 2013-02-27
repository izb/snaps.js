define(function() {

    'use strict';

    return {

        copyProps: function(s,d) {
            for (var prop in s) {
                if (s.hasOwnProperty(prop)) {
                    d[prop] = s[prop];
                }
            }
            return d;
        }

    };

});
