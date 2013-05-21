/*global define,describe,expect,it,require*/
define('spec/minheap', ['snaps'], function(Snaps) {


    /* The tests */

    describe('Minheap', function() {


        it('should sort items inserted in ascending order', function() {

            require(['util/minheap'], function(MinHeap) {

                var item;
                var mh = new MinHeap();

                mh.push({val:1, priority:1});
                mh.push({val:2, priority:2});
                mh.push({val:3, priority:3});
                mh.push({val:4, priority:4});
                mh.push({val:5, priority:5});

                expect(mh.pop().priority).to.equal(1);
                expect(mh.pop().priority).to.equal(2);
                expect(mh.pop().priority).to.equal(3);
                expect(mh.pop().priority).to.equal(4);
                expect(mh.pop().priority).to.equal(5);
                expect(mh.pop()).to.equal(undefined);

            });

        });

        it('should sort items inserted in descending order', function() {

            require(['util/minheap'], function(MinHeap) {

                var item;
                var mh = new MinHeap();

                mh.push({val:1, priority:5});
                mh.push({val:2, priority:4});
                mh.push({val:3, priority:3});
                mh.push({val:4, priority:2});
                mh.push({val:5, priority:1});

                expect(mh.pop().priority).to.equal(1);
                expect(mh.pop().priority).to.equal(2);
                expect(mh.pop().priority).to.equal(3);
                expect(mh.pop().priority).to.equal(4);
                expect(mh.pop().priority).to.equal(5);
                expect(mh.pop()).to.equal(undefined);

            });

        });

        it('should maintain insert order for equal priorities', function() {

            require(['util/minheap'], function(MinHeap) {

                var item;
                var mh = new MinHeap();

                mh.push({val:1, priority:1});
                mh.push({val:2, priority:1});
                mh.push({val:3, priority:3});
                mh.push({val:4, priority:3});
                mh.push({val:5, priority:5});
                mh.push({val:6, priority:5});
                mh.push({val:7, priority:2});

                expect(mh.pop().val).to.equal(1);
                expect(mh.pop().val).to.equal(2);
                expect(mh.pop().val).to.equal(7);
                expect(mh.pop().val).to.equal(3);
                expect(mh.pop().val).to.equal(4);
                expect(mh.pop().val).to.equal(5);
                expect(mh.pop().val).to.equal(6);

            });

        });
    });

});
