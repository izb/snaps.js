define(['map/tile', 'util/bitmap', 'util/debug', 'util/js'], function(Tile, Bitmap, debug, js) {

    'use strict';

    var debugText = debug.debugText;
    var copyProps = js.copyProps;

    function StaggeredIsometric(tileData, hitTests, clientWidth, clientHeight) {
        this.data = tileData;
        this.hitTests = hitTests;
        this.maxXOverdraw = 0;
        this.maxYOverdraw = 0;
        this.clientWidth = clientWidth;
        this.clientHeight = clientHeight;


       this.minxoffset = this.data.tilewidth/2;
       this.minyoffset = this.data.tileheight/2;

       this.maxxoffset = this.data.width * this.data.tilewidth - this.clientWidth;
       this.maxyoffset = this.data.height * (this.data.tileheight/2) - this.clientHeight;

        /* Start in SW-corner by default */
        this.xoffset = this.minxoffset;
        this.yoffset = this.maxyoffset;

    }

    StaggeredIsometric.prototype.minOffsets = function() {

        return {
            minxoffset: this.data.tilewidth/2,
            minyoffset: this.data.tileheight/2,

            maxxoffset: this.data.width * this.data.tilewidth - this.clientWidth,
            maxyoffset: this.data.height * (this.data.tileheight/2) - this.clientHeight
        };

    };

    StaggeredIsometric.prototype.primePreloader = function(preloader) {

        var map = this.data;
        var _this = this;

        /* Add tiles to the preloader */
        var storeTile = function(image, ts){
            ts.image = image;
        };

        for (var i = 0; i < map.tilesets.length; i++) {
            var ts = map.tilesets[i];
            preloader.add(ts.image, ts, storeTile);
        }

        var storeHitTest = function(image, name) {
            if (image.width!==map.tilewidth || image.height!==map.tileheight) {
                throw "Hit test image "+name+" does not match map tile size";
            }

            if (name==='hit') {
                _this.hitTest = Bitmap.imageToRData(image);
            } else {
                /* TODO: Figure out what to do with custom hit test images */
            }
        };

        for(var testName in this.hitTests) {
            preloader.add(this.hitTests[testName], testName, storeHitTest);
        }
    };

    StaggeredIsometric.prototype.resolveTiles = function() {

        var i, j, k, ts;

        var map = this.data;

        for (k = map.tilesets.length - 1; k >= 0; k--) {
            ts = map.tilesets[k];
            ts.xspan = Math.floor(ts.imagewidth / ts.tilewidth);
            ts.yspan = Math.floor(ts.imageheight / ts.tileheight);
        }

        for (i = 0; i < map.layers.length; i++) {
            var l = map.layers[i];
            l.rows = [];
            var row = [];
            for (j = 0; j < l.data.length; j++) {
                var d = l.data[j];
                for (k = map.tilesets.length - 1; k >= 0; k--) {
                    ts = map.tilesets[k];
                    if(ts.firstgid<=d) {
                        break;
                    }
                }
                var t = d - ts.firstgid;
                var y = Math.floor(t / ts.xspan);
                var x = t - ts.xspan * y;

                var xoverdraw = ts.tilewidth - map.tilewidth;
                var yoverdraw = ts.tileheight - map.tileheight;

                this.maxXOverdraw = Math.max(xoverdraw, this.maxXOverdraw);
                this.maxYOverdraw = Math.max(yoverdraw, this.maxYOverdraw);

                row.push(new Tile(
                        ts.image,
                        x * ts.tilewidth,
                        y * ts.tileheight,
                        ts.tilewidth,
                        ts.tileheight,
                        ts.tilewidth - map.tilewidth,
                        ts.tileheight - map.tileheight,
                        ts.properties
                    ));
                if (row.length>= l.width) {
                    l.rows.push(row);
                    row = [];
                }
            }
        }
    };

    StaggeredIsometric.prototype.drawDebugRegions = function(ctx) {

        var map = this.data;
        var l, layerEndY, layerEndX, r, x, y, i, stagger;

        var xstep = map.tilewidth;
        var ystep = map.tileheight / 2;

        var starty = Math.floor((this.yoffset-ystep) / ystep);
        var endy = Math.floor((this.yoffset+this.clientHeight-ystep+this.maxYOverdraw) / ystep)+1;

        var startx = Math.floor((this.xoffset+this.clientWidth -1 ) / xstep);
        var endx = Math.floor((this.xoffset-xstep/2-this.maxXOverdraw) / xstep);

        l = map.layers[0];

        layerEndY = Math.min(endy, l.rows.length-1);
        layerEndX = Math.max(endx, 0);

        for (y = starty; y <= layerEndY; y++) {
            r = l.rows[y];
            var redgreen;
            if (y&1) {
                stagger = map.tilewidth/2;
                redgreen = '#f00';
            } else {
                stagger = 0;
                redgreen = '#0f0';
            }

            for (x = startx; x >= layerEndX; x--) {
                ctx.strokeStyle = redgreen;
                var rx = Math.floor(-this.xoffset) + stagger + x * xstep;
                var ry = Math.floor(-this.yoffset) + y * ystep;
                var rw = map.tilewidth;
                var rh = map.tileheight;

                ctx.strokeRect(rx, ry, rw, rh);
                ctx.strokeStyle = '#aaa';
                ctx.beginPath();
                ctx.moveTo(rx, ry + rh/2);
                ctx.lineTo(rx+rw/2, ry);
                ctx.lineTo(rx+rw, ry+rh/2);
                ctx.lineTo(rx+rw/2, ry+rh);
                ctx.closePath();
                ctx.stroke();
            }
        }

        for (i = 0; i < map.layers.length; i++) {
            l = map.layers[i];

            for (y = 0; y < l.rows.length; y++) {
                r = l.rows[y];
                stagger = y&1?map.tilewidth/2:0;
                for (x = r.length-1; x >= 0; x--) {
                    debugText(ctx,
                            x+","+y,
                            85+Math.floor(-this.xoffset) + stagger + x * xstep,
                            55+Math.floor(-this.yoffset) + y * ystep);
                }
            }
        }
    };

    StaggeredIsometric.prototype.screenToWorldPos = function(x,y) {
        return {x:x+this.xoffset, y:y+this.yoffset};
    };

    StaggeredIsometric.prototype.scroll = function(dx,dy) {
        this.xoffset+=dx;
        this.yoffset+=dy;

        if (this.xoffset < this.minxoffset) {
            this.xoffset = this.minxoffset;
        } else if (this.xoffset > this.maxxoffset) {
            this.xoffset = this.maxxoffset;
        }

        if (this.yoffset < this.minyoffset) {
            this.yoffset = this.minyoffset;
        } else if (this.yoffset > this.maxyoffset) {
            this.yoffset = this.maxyoffset;
        }
    };

    StaggeredIsometric.prototype.worldToTilePos = function(x, y) {
        // http://gamedev.stackexchange.com/a/48507/3188

        var map = this.data;

        var tw = map.tilewidth;
        var th = map.tileheight;

        var eventilex = Math.floor(x%tw);
        var eventiley = Math.floor(y%th);

        if (this.hitTest[eventilex + eventiley * tw] !== 255) {
            /* On even tile */

            return {
                x: Math.floor((x + tw) / tw) - 1,
                y: 2 * (Math.floor((y + th) / th) - 1)
            };
        } else {
            /* On odd tile */

            return {
                x: Math.floor((x + tw / 2) / tw) - 1,
                y: 2 * (Math.floor((y + th / 2) / th)) - 1
            };
        }
    };

    StaggeredIsometric.prototype.screenToTilePos = function(x, y) {
        return this.worldToTilePos(x+this.xoffset, y+this.yoffset);
    };

    StaggeredIsometric.prototype.screenToWorldPos = function(x, y) {
        return {x:x+this.xoffset, y:y+this.yoffset};
    };

    StaggeredIsometric.prototype.worldToScreenPos = function(x, y) {
        return {x:x-this.xoffset, y:y-this.yoffset};
    };

    StaggeredIsometric.prototype.drawWorld = function(ctx, now, sprites) {

        var map = this.data;

        var xstep = map.tilewidth;
        var ystep = map.tileheight / 2;

        var starty = Math.floor((this.yoffset-ystep) / ystep);
        var endy = Math.floor((this.yoffset+this.clientHeight-ystep+this.maxYOverdraw) / ystep)+1;

        var startx = Math.floor((this.xoffset+this.clientWidth -1 ) / xstep);
        var endx = Math.floor((this.xoffset-xstep/2-this.maxXOverdraw) / xstep);

        /* Sort sprites first by height, then by y-axis */
        sprites.sort(function(a, b) {
            var n = a.y - b.y;
            return n!==0?n:a.h - b.h;
        });

        var spriteCursor = 0;

        var stagger = 0;
        var x, y, r, l, i, layerEndY, layerEndX;
        for (i = 0; i < map.layers.length; i++) {
            l = map.layers[i];

            layerEndY = Math.min(endy, l.rows.length-1);
            layerEndX = Math.max(endx, 0);

            for (y = starty; y <= layerEndY; y++) {
                r = l.rows[y];
                stagger = y&1?map.tilewidth/2:0;
                for (x = startx; x >= layerEndX; x--) {
                    var t = r[x];
                    t.draw(
                            ctx,
                            Math.floor(-this.xoffset) + stagger + x * xstep,
                            Math.floor(-this.yoffset) + y * ystep);
                }

                if (i==1) {
                    var z = (y+2) * ystep;
                    while(spriteCursor<sprites.length && z>=sprites[spriteCursor].y) {
                        sprites[spriteCursor++].draw(ctx, this.xoffset, this.yoffset, now);
                    }
                }
            }
        }
    };

    return StaggeredIsometric;

});
