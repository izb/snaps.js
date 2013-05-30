/*global define*/
define(['util/minheap',
        'util/uid',
        'util/clock'],

function(MinHeap, uid, clock) {

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
        this.queue        = new MinHeap();
        this.maxFrameTime = maxFrameTime;
        this.id           = uid();
        this.currentTask  = null;
    }

    /**
     * Add a new task to the queue
     * @method module:util/slowqueue.SlowQueue#addTask
     * @param  {Object} task A task to add. This is an object that exposes two function
     * properties.
     * <dl>
     *  <dt>taskBegin</dt><dd>A function that is passed the parameters object given in this method. The
     *      cost of calling this method does not count towards the time consumed by the task, so it should
     *      return as quickly as possible. Any value returned from this function is discarded.</dd>
     *  <dt>taskResume</dt><dd>A function that is called one or more times in order to complete the task.
     *      It takes one parameter, which is the time at which it is expected to complete by. If it has
     *      not completed by that time, it should return. The taskResume function will be called again on
     *      the next frame.
     *      It should return null if the task is incomplete, and any other value as the task result.
     *      If a task is passed 0 as its completion time, it should consider itself unlimited in the
     *      amount of time it can use.</dd>
     * </dl>
     * Note that task objects are expected to maintain state between calls to taskResume. This means that
     * using the object outside a queue could potentially yield unpredictable results. The best idea is to
     * create objects specifically for the queue. E.g. create two pathfinders; one for the task queue to
     * utilise and one to use outside the queue.
     * @param  {Object} [parameters] Arbitrary object passed to <code>taskBegin</code>.
     * @param  {Number} [priority=2] The task priority. High priority tasks will be
     * done before low ones. Partially completed tasks always have top priority. Low numbers
     * are higher priority than high numbers.
     * @param {String} [handle] A handle for the task so that groups of tasks can be aborted. E.g.
     * if the queue is full of tasks with the handle 'hostile_behaviour' then you can abort all
     * tasks of that kind.
     * @param  {Function} [onComplete] Once the task is complete, this function will be called, passing
     * in any result object from the task.
     */
    SlowQueue.prototype.addTask = function(task, parameters, priority, handle, onComplete) {
        priority = priority===undefined?2:priority;

        this.queue.push({
            task:       task,
            handle:     handle,
            parameters: parameters,
            priority:   priority,
            onComplete: onComplete
        });
    };

    SlowQueue.prototype.size = function() {
        var count = this.queue.size();
        if (this.currentTask===null) {
            return count;
        }
        return count + 1;
    };


    /**
     * Aborts tasks running or in the queue.
     * @param  {String} [handle] Tasks with this handle will be aborted. If omitted, all
     * tasks will be aborted.
     */
    SlowQueue.prototype.abort = function(handle) {
        var t;

        if (handle) {
            if (this.currentTask!==null && this.currentTask.handle===handle) {
                this.currentTask = null;
            }

            if (this.queue.size()>0) {
                var newq = new MinHeap();
                while(t = this.queue.pop()) {
                    if (t.handle!==handle) {
                        newq.push(t);
                    }
                }
            }
        } else {
            this.currentTask = null;
            this.queue.clear();
        }
    };

    var nextTask = function() {
        if (this.currentTask !== null || this.queue.size()===0) {
            return false;
        }

        var task = this.queue.pop();
        if (task) {
            this.currentTask = task;
            return true;
        }
        return false;
    };

    /**
     * Runs the task queue. The queue will make a best effort to return within the
     * configured max frame time.
     * @method module:util/slowqueue.SlowQueue#run
     */
    SlowQueue.prototype.run = function() {

        var now = clock.now();
        var end = now + this.maxFrameTime;

        var isnew = nextTask.call(this);
        if (this.currentTask===null) {
            /* Well, that was easy. */
            return;
        }
        var t = this.currentTask;

        if (isnew) {
            t.task.taskBegin(t.parameters);
        }

        /* TODO: Run more than one task per frame if we have the time budget */

        var result = t.task.taskResume(end);
        if (result === null) {
            /* Task incomplete */
            return;
        }

        if (t.onComplete) {
            t.onComplete(result);
            this.currentTask = null;
        }
    };

    return SlowQueue;
});
