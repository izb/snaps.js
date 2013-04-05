/*global define*/
define(function() {

    'use strict';

    /**
     * Implementation of a min heap.
     *
     * http://www.digitaltsunami.net/projects/javascript/minheap/index.html
     *
     * Modified to expect only to contain objects that expose a 'score'
     * value for comparison.
     */

    function MinHeap() {

        this.heap = [];

        /**
         * Retrieve the index of the left child of the node at index i.
         */
        this.left = function(i) {
            return 2 * i + 1;
        };

        /**
         * Retrieve the index of the right child of the node at index i.
         */
        this.right = function(i) {
            return 2 * i + 2;
        };

        /**
         * Retrieve the index of the parent of the node at index i.
         */
        this.parent = function(i) {
            return Math.ceil(i / 2) - 1;
        };

        /**
         * Ensure that the contents of the heap don't violate the
         * constraint.
         */
        this.heapify = function(i) {
            var lIdx = this.left(i);
            var rIdx = this.right(i);
            var smallest;
            if (lIdx < this.heap.length && (this.heap[lIdx].score < this.heap[i].score)) {
                smallest = lIdx;
            } else {
                smallest = i;
            }
            if (rIdx < this.heap.length && (this.heap[rIdx].score < this.heap[smallest].score)) {
                smallest = rIdx;
            }
            if (i !== smallest) {
                var temp = this.heap[smallest];
                this.heap[smallest] = this.heap[i];
                this.heap[i] = temp;
                this.heapify(smallest);
            }
        };

        /**
         * Starting with the node at index i, move up the heap until parent value
         * is less than the node.
         */
        this.siftUp = function(i) {
            var p = this.parent(i);
            if (p >= 0 && (this.heap[p].score < this.heap[i].score)) {
                var temp = this.heap[p];
                this.heap[p] = this.heap[i];
                this.heap[i] = temp;
                this.siftUp(p);
            }
        };
    }

    /**
     * Place an item in the heap.
     * @param item
     */
    MinHeap.prototype.push = function(item) {
        this.heap.push(item);
        this.siftUp(this.heap.length - 1);
    };

    /**
     * Insert an item into the heap.
     * @param item
     */
    MinHeap.prototype.insert = function(item) {
        this.push(item);
    };

    /**
     * Pop the minimum valued item off of the heap. The heap is then updated
     * to float the next smallest item to the top of the heap.
     * @returns the minimum value contained within the heap.
     */
    MinHeap.prototype.pop = function() {
        var value;
        if (this.heap.length > 1) {
            value = this.heap[0];
            // Put the bottom element at the top and let it drift down.
            this.heap[0] = this.heap.pop();
            this.heapify(0);
        } else {
            value = this.heap.pop();
        }
        return value;
    };


    /**
     * Returns the minimum value contained within the heap.  This will
     * not remove the value from the heap.
     * @returns the minimum value within the heap.
     */
    MinHeap.prototype.peek = function() {
        return this.heap[0];
    };

    /**
     * Return the current number of elements within the heap.
     * @returns size of the heap.
     */
    MinHeap.prototype.size = function() {
        return this.heap.length;
    };

    MinHeap.prototype.clear = function() {
        this.heap.length = 0;
        return this;
    };

    return MinHeap;
});
