describe('queue', function () {
  it('should run a queue of async tasks', function (done) {
    var iterator = chai.spy(function (req, next) {
      q.workers.should.be.below(3);
      req.should.deep.equal({ hello: 'universe' });
      next.should.be.a('function');
      setTimeout(function () {
        next(null, 'world');
      }, 10);
    });

    var spy1 = chai.spy(function (err, res) {
      should.not.exist(err);
      res.should.equal('world');
    });

    var spy2 = chai.spy(function (err, res) {
      should.not.exist(err);
      res.should.equal('world');
    });

    var onerror = chai.spy();

    var q = new Queue(iterator, 2);
    q.onerror = onerror;

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], spy1);

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], spy2);

    setTimeout(function () {
      iterator.should.have.been.called(6);
      spy1.should.have.been.called(3);
      spy2.should.have.been.called(3);
      onerror.should.have.not.been.called();
      done();
    }, 100);

    q.process();
  });

  it('should start automatically with a push', function (done) {
    var iterator = chai.spy(function (req, next) {
      q.workers.should.be.below(3);
      req.should.deep.equal({ hello: 'universe' });
      next.should.be.a('function');
      setTimeout(function () {
        next(null, 'world');
      }, 10);
    });

    var spy2 = chai.spy(function (err, res) {
      should.not.exist(err);
      res.should.equal('world');
    });

    var onerror = chai.spy();

    var q = new Queue(iterator, 2);
    q.onerror = onerror;

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], true);

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], spy2);

    setTimeout(function () {
      iterator.should.have.been.called(6);
      spy2.should.have.been.called(3);
      onerror.should.have.not.been.called();
      done();
    }, 100);
  });

  it('will execute a proper functions', function (done) {
    var iterator = chai.spy('iterator', function (req, next) {
      q.workers.should.be.below(3);
      req.should.deep.equal({ hello: 'universe' });
      next.should.be.a('function');
      setTimeout(function () {
        next(null, 'world');
      }, 10);
    });

    var spy1 = chai.spy(function (err, res) {
      should.not.exist(err);
      res.should.equal('world');
    });

    var spy2 = chai.spy(function (err, res) {
      should.not.exist(err);
      res.should.equal('world');
    });

    var q = new Queue(iterator, 2);

    var onerror = chai.spy()
      , drain = chai.spy(function () {
          q.workers.should.equal(0);
          q.should.have.lengthOf(0);
        })
      , empty = chai.spy(function () {
          q.workers.should.be.above(0).and.below(3);
          q.should.have.lengthOf(0);
        })
      , saturated = chai.spy(function () {
          q.should.have.lengthOf(2);
        });

    q.onerror = onerror;
    q.drain = drain;
    q.empty = empty;
    q.saturated = saturated;

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], spy1, true);

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], spy2, true);

    setTimeout(function () {
      iterator.should.have.been.called(6);
      spy1.should.have.been.called(3);
      spy2.should.have.been.called(3);
      onerror.should.have.not.been.called();
      drain.should.have.been.called.once;
      empty.should.have.been.called.once;
      saturated.should.have.been.called.once;
      done();
    }, 100);
  });

  it('will execute an onerror function on an error', function (done) {
    var count = 0;
    var iterator = chai.spy(function (req, next) {
      q.workers.should.be.below(3);
      req.should.deep.equal({ hello: 'universe' });
      next.should.be.a('function');
      setTimeout(function () {
        count++;
        if (count == 4) return next('err');
        next(null, 'world');
      }, 10);
    });

    var spy1 = chai.spy();

    var spy2 = chai.spy();

    var onerror = chai.spy(function (err) {
      err.should.equal('err');
    });

    var q = new Queue(iterator, 2);
    q.onerror = onerror;

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], spy1, true);

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], spy2, true);

    setTimeout(function () {
      iterator.should.have.been.called.below(6);
      spy1.should
        .have.been.called(3)
        .always.with.exactly(null, 'world');
      spy2.should
        .have.been.called
        .with.exactly('err');
      onerror.should.have.been.called.once;
      done();
    }, 100);
  });

  it('should allow for queue processing to be paused', function (done) {
    var count = 0;
    var iterator = chai.spy(function (req, next) {
      setTimeout(function () {
        count++;
        if (count === 2) q.pause();
        next(null);
      }, 10);
    });

    var drainSpy = chai.spy(function () {
      q.drain = null;
      q.resume();
    });

    var q = new Queue(iterator, 2);
    q.drain = drainSpy;

    q.push([
        { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
      , { hello: 'universe' }
    ], true);

    setTimeout(function () {
      iterator.should.have.been.called(6);
      drainSpy.should.have.been.called.once;
      done();
    }, 100);
  });
});
