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

    var q = queue(iterator, 2);
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
      iterator.should.have.been.called.exactly(6);
      spy1.should.have.been.called.exactly(3);
      spy2.should.have.been.called.exactly(3);
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

    var q= queue(iterator, 2);
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
      iterator.should.have.been.called.exactly(6);
      spy2.should.have.been.called.exactly(3);
      onerror.should.have.not.been.called();
      done();
    }, 100);
  });

  it('will execute a proper functions', function (done) {
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

    var onerror = chai.spy()
      , drain = chai.spy(function () {
          iterator.should.have.been.called.exactly(6);
        })
      , empty = chai.spy(function () {
          iterator.should.have.been.called.exactly(5);
        })
      , saturated = chai.spy(function () {
          q.should.have.length(2);
        });

    var q= queue(iterator, 2);
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
      iterator.should.have.been.called.exactly(6);
      spy1.should.have.been.called.exactly(3);
      spy2.should.have.been.called.exactly(3);
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

    var spy1 = chai.spy(function (err, res) {
      should.not.exist(err);
      res.should.equal('world');
    });

    var spy2 = chai.spy(function (err, res) {
      err.should.equal('err');
    });

    var onerror = chai.spy(function (err) {
      err.should.equal('err');
    });

    var q = queue(iterator, 2);
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
      iterator.should.have.been.called.exactly(5);
      spy1.should.have.been.called.exactly(3);
      spy2.should.have.been.called.exactly(1); // we don't call the rest of the callbacks
      onerror.should.have.been.called.once;
      done();
    }, 100);
  });
});
