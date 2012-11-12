var nextTick = require('breeze-nexttick');

var noop = function () {};

/**
 * ### queue (iterator, concurrency)
 *
 * The queue mechanism allows for a any number of
 * data objects to be processed by an iterator
 * when they become available. The queue will processes
 * items in parellel, up to a given concurrently value,
 * then will wait until an item has finished until
 * beginning to process the next. The items queued
 * can have a callback executed when it has completed
 * its iterator. In addition, a queue may also have
 * functions attached to listen for specific events.
 * On such event is an error. Should any item in the queue
 * fail to process and provide an error to it's `done`
 * callback, no further items will be processed.
 *
 * @param {Function} iterator
 * @param {Number} concurrency (defaults to 10)
 * @returns {Object} queue
 * @name queue
 * @api public
 */

module.exports = function (iterator, concurrency) {
  var queue = new Queue(iterator, concurrency);
  return queue;
};

/*!
 * Queue
 *
 * The Queue constructor will hold all of the necissary
 * settings to correctly execute a queue.
 *
 * @param {Function} iterator
 * @param {Number} concurrency (defaults to 10)
 * @api private
 */

function Queue (iterator, concurrency) {
  this._iterator = iterator;
  this._concurrency = concurrency || 10;
  this._tasks = [];
  this._err = false;
  this.workers = 0;
}

/**
 * #### .length
 *
 * Property indicating the number of items current
 * in the queue. An item is removed from this list
 * prior to being processed.
 *
 * @returns {Number} count of queued items
 * @api public
 */

Object.defineProperty(Queue.prototype, 'length',
  { get: function () {
      return this._tasks.length;
    }
});

/**
 * #### .push (items[, callback[, autostart]])
 *
 * You can push an item or an array of items into
 * the queue for processing. The callback will be
 * called for the completion of each item if the queue
 * has not entered into an error state. A `autostart`
 * boolean my also be provided if you wish to start
 * processing the queue with this push of items. If
 * no pushes provide the autostart, then the queue
 * must be started manually with `.process()`.
 *
 * Note that if the queue has already been started but
 * has been drained of items, it will not start again
 * with another push unless the `autostart` toggle is present.
 *
 * @param {Array} item or items to be added to the queue
 * @param {Function} callback for completion of each item
 * @param {Boolean} autostart process (defaults to false)
 * @name push
 * @api public
 */

Queue.prototype.push = function (items, cb, start) {
  if ('boolean' === typeof cb) start = cb, cb = noop;
  if (!Array.isArray(items)) items = [ items ];
  cb = cb || noop;
  var cc = this._concurrency
    , sat = this.saturated;
  for (var i = 0, l = items.length; i < l; i ++) {
    var task = items[i];
    this._tasks.push({ task: task , cb: cb });
    if (sat && this._tasks.length === cc) sat();
    if (start) nextTick(this.process.bind(this));
  }
};

/**
 * #### .process ()
 *
 * Begin the queue processing cycle.
 *
 * @name process
 * @api public
 */

Queue.prototype.process = function () {
  var self = this
    , cc = this._concurrency
    , iterator = this._iterator
  if (this.workers < cc && this.length && !this._err) {
    var task = this._tasks.shift();
    if (this.empty && !this.length) this.empty();
    this.workers++;
    iterator(task.task, function next () {
      self.workers--;
      if (self._err) return;
      var err = arguments[0];
      if (err) self._err = true;
      if (task.cb) task.cb.apply(task, arguments);
      if (err && self.onerror) return self.onerror(err);
      if (self.drain && self.length + self.workers === 0) self.drain();
      self.process();
    });
    this.process();
  }
};

/**
 * #### .onerror
 *
 * Setting this to a function will provide a listener
 * should an error occur. It will not be executed otherwise.
 *
 * @default null
 * @expected {Function} on error callback
 * @cb {Error} object that was passed as error during iteration
 * @api public
 */

Queue.prototype.onerror = null;

/**
 * #### .saturated
 *
 * This listener will be executed when the number of
 * queued items exceeds the current concurrency value.
 * This will be executed directly after the push of
 * said items
 *
 * @default null
 * @expected {Function}
 * @api public
 */

Queue.prototype.saturated = null;

/**
 * #### .empty
 *
 * This listener will be executed when the queue is empty.
 * In other words, prior to the last item in the queue
 * being processed.
 *
 * @default null
 * @expected {Function}
 * @api public
 */

Queue.prototype.empty = null;

/**
 * #### .drain
 *
 * This listener will be executed when all queued
 * items have been executed through the iterator.
 *
 * @default null
 * @expected {Function}
 * @api public
 */

Queue.prototype.drain = null;
