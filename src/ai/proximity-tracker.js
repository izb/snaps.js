/*global define*/
define(function() {

    function ProximityTracker(cellx, celly) {

    }

    /* TODO : This should be able to quickly tell you what sprites are closest to a point. */
    
    /** Use this in conjunction with the track plugin. Add it to the list of sprite
     * updaters on your tracked sprites, after the sprite has moved. E.g.
     * 
     * updates:[{
     *     name: 'some-sprite-moving-plugin'
     * }, {
     *     name:'track',
     *     fn: myProximityTracker.track.bind(myProximityTracker)
     * }]

     */
    ProximityTracker.prototype.track = function(sprite) {
        
    }

    return ProximityTracker;

});
