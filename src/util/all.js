/*global define*/
define([
    'util/preload',
    'util/rnd',
    'util/bitmap',
    'util/debug',
    'util/js',
    'util/guid',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, guid, Url) {

    'use strict';

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        guid: guid,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});
