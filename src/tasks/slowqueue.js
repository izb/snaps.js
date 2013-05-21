/*global define*/
define(['util/minheap', 'util/uid'], function(MinHeap, uid) {

    'use strict';

    /**
     * @module util/slowqueue
     */

    /**
     * Implementation of a slow task queue. Task items are dequeued based on an allotted amount
     * of processing time per frame. Normally you would not construct this directly, but rather you
     * would use the engine's {@link module:snaps.Snaps#createTaskQueue|createTaskQueue  factory method}.
     * @constructor module:util/slowqueue.SlowQueue
     * @param {Number} maxFrameTime The max time permitted on each frame for processing
     * items on the queue. Tasks may take more than one time slot to complete. Queue processing
     * may exceed this if a task does not honour its promise to return within the given time.
     */
    function SlowQueue(maxFrameTime) {
        /* TODO: Perhaps a started task should always take priority, since you might be able to post
         * a higher priority task on the same object, and explode its state. */
        this.queue = new MinHeap();
        this.maxFrameTime = maxFrameTime;
        this.id = uid();
    }

    /**
     * Add a new task to the queue
     * @method module:util/slowqueue.SlowQueue#addTask
     * @param  {Object} task A task to add
     * @param  {Number} [priority=1] The task priority. High priority tasks will be
     * done before low ones. Partially completed tasks always have top priority. Low numbers
     * are higher priority than high numbers.
     */
    SlowQueue.prototype.addTask = function(task, priority) {
        priority = priority===undefined?1:priority;

        /* TODO: What the heck is a task? */

        this.queue.push({
            task:task,
            priority:priority
        });
    };

    /**
     * Runs the task queue. The queue will make a best effort to return within the
     * configured max frame time.
     * @method module:util/slowqueue.SlowQueue#run
     */
    SlowQueue.prototype.run = function() {
        /* TODO */
    };

    return SlowQueue;
});
