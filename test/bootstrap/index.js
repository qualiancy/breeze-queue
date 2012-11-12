/*!
 * Attach chai to global should
 */

global.chai = require('chai');
global.should = global.chai.should();

/*!
 * Chai Plugins
 */

//global.chai.use(require('chai-spies'));
//global.chai.use(require('chai-http'));

/*!
 * Import project
 */

global.queue = require('../..');

/*!
 * Helper to load internals for cov unit tests
 */

function req (name) {
  return process.env.queue_COV
    ? require('../../lib-cov/queue/' + name)
    : require('../../lib/queue/' + name);
}

/*!
 * Load unexposed modules for unit tests
 */

global.__queue = {};
