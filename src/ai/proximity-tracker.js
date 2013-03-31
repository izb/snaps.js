/*global define*/
define(function() {

    /**
     * This constructor is magically bound when exposed through the engine ref,
     * so construct it without the first parameter, e.g.
     * new sn.ProximityTracker(myCellSize);
     */
    function ProximityTracker(sn, cellSize) {
        
        /*
         * Cell size is the width. In isometric world, the height will be half.
         * This means that our scan will still be cells defined by a circle, but
         * the cells aren't square, so we'll be fine.
         */
         
        if (cellSize<2 ||(cellSize&1)!==0 || (cellSize!==cellSize|0)) {
            throw "Cell size must be an even integer > 0";
        }

        this.cellw=cellSize;
        this.cellh=cellSize/2;
        
        this.sn = sn;
        
        var edges = sn.getWorldEdges();
        
        this.le = edges.le;
        this.re = edges.re;
        this.te = edges.te;
        this.be = edges.be;
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
        /* TODO This is called on each movement. It's also called once
         * when the sprite is created to register it with the tracker. */
    }

    return ProximityTracker;

});
