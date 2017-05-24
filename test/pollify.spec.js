'use strict';
const chai = require('chai');
const expect = chai.expect;

const Pollify = require('..');

describe('Pollify', function () {
  const rate = 20;

  it('starts polling automatically', function (done) {
    const times = [];
    const maxPolls = 2;
    const poll = new Pollify({ rate, mode: 'return' }, () => '');

    poll.on('data', (data, time) => {
      times.push(time);

      if (times.length === maxPolls) {
        expect(times[1] - times[0]).to.be.at.least(rate);
        poll.stop();
        done();
      }
    });
  });
  it('can be provided a variable number of arguments for the poll function', function (done) {
    const randLength = Math.ceil(Math.random() * 10) + 5;
    const randomArray = [];
    for (let i = 0; i < randLength; ++i) {
      randomArray.push(i);
    }
    const poll = new Pollify({ rate, mode: 'return' }, (...args) => args, ...randomArray);

    poll.on('data', data => {
      expect(data).to.eql(randomArray);
      poll.stop();
      done();
    });
  });
  it('can stop polling', function (done) {
    let numberOfPolls = 0;
    const maxPolls = 2;
    const poll = new Pollify({ rate, mode: 'return' }, () => '');

    poll.on('data', () => {
      ++numberOfPolls;

      if (numberOfPolls === maxPolls) {
        poll.stop();
        setTimeout(() => {
          expect(numberOfPolls).to.equal(maxPolls);
          done();
        }, rate * 2);
      }
    });
  });
  it('can start polling again after stopping', function (done) {
    let numberOfPolls = 0;
    const maxPolls = 2;
    const poll = new Pollify({ rate, mode: 'return' }, () => '');
    let timeoutFlag = false; // Used to indicate that poll has restarted after a timeout

    poll.on('data', () => {
      ++numberOfPolls;

      if (numberOfPolls === maxPolls) {
        poll.stop();

        setTimeout(() => {
          timeoutFlag = true;
          expect(numberOfPolls).to.equal(maxPolls);
          poll.start();
        }, rate * 2);
      }

      if (timeoutFlag) {
        expect(numberOfPolls).to.be.above(maxPolls);
        poll.stop();
        done();
      }
    });
  });
  it('does not have any effect when repeated start calls are made', function (done) {
    const times = [];
    const maxPolls = 10;
    const poll = new Pollify({ rate, mode: 'return' }, () => '');
    poll.start();
    poll.start();
    poll.start();

    poll.on('data', (data, time) => {
      times.push(time);

      if (times.length === maxPolls) {
        // Repeated starts shouldn't start multiple polls. Therefore the diff between times should be at least rate
        for (let i = 1; i < times.length; ++i) {
          expect(times[i] - times[i - 1]).to.be.at.least(rate);
        }

        poll.stop();
        done();
      }
    });
  });
  it('does not have any effect when repeated stop calls are made', function (done) {
    let numberOfPolls = 0;
    const maxPolls = 2;
    const poll = new Pollify({ rate, mode: 'return' }, () => '');
    let timeoutFlag = false; // Used to indicate that poll has restarted after a timeout

    poll.on('data', () => {
      ++numberOfPolls;

      if (numberOfPolls === maxPolls) {
        poll.stop();
        poll.stop();
        poll.stop();

        setTimeout(() => {
          timeoutFlag = true;
          expect(numberOfPolls).to.equal(maxPolls);
          poll.start();
        }, rate * 2);
      }

      if (timeoutFlag) {
        expect(numberOfPolls).to.be.above(maxPolls);
        poll.stop();
        done();
      }
    });
  });
  describe('Polling Function Types', function () {
    it('polls regular functions', function (done) {
      const poll = new Pollify({ rate, mode: 'return' }, () => '');

      poll.on('data', () => {
        poll.stop();
        done();
      });
    });
    it('polls callback functions', function (done) {
      const poll = new Pollify({ rate, mode: 'callback' }, cb => cb(null));

      poll.on('data', () => {
        poll.stop();
        done();
      });
    });
    it('polls promise functions', function (done) {
      const poll = new Pollify({ rate, mode: 'promise' }, () => Promise.resolve());

      poll.on('data', () => {
        poll.stop();
        done();
      });
    });
    it('emits error events for regular function polling', function (done) {
      const e = new Error();
      const poll = new Pollify({ rate, mode: 'return' }, () => {
        throw e;
      });

      poll.on('error', err => {
        expect(err).to.equal(e);
        poll.stop();
        done();
      });
    });
    it('emits error events for callback function polling', function (done) {
      const e = new Error();
      const poll = new Pollify({ rate, mode: 'callback' }, cb => cb(e));

      poll.on('error', err => {
        expect(err).to.equal(e);
        poll.stop();
        done();
      });
    });
    it('emits error events for promise function polling', function (done) {
      const e = new Error();
      const poll = new Pollify({ rate, mode: 'promise' }, () => Promise.reject(e));

      poll.on('error', err => {
        expect(err).to.equal(e);
        poll.stop();
        done();
      });
    });
  });
});
