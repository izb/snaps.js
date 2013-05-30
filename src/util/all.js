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
    'util/clock',
    'util/url'],
function(Preloader, rnd, Bitmap, debug, js, MinHeap, Stats, uid, clock, Url) {

    'use strict';

    /**
     * @module util/all
     * @private
     */

    return {
        Preloader: Preloader,
        rnd: rnd,
        js: js,
        MinHeap: MinHeap,
        Stats: Stats,
        uid: uid,
        clock: clock,
        debug: debug,
        Bitmap: Bitmap,
        Url: Url
    };

});
