/*global define*/
define([
    'util/preload',
    'util/rnd',
    'util/bitmap',
    'util/debug',
    'util/js',
    'util/minheap',
    'util/stats',
    'util/uid',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, MinHeap, Stats, uid, Url) {

    'use strict';

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        MinHeap: MinHeap,
        Stats: Stats,
        uid: uid,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});
