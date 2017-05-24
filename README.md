# Pollify

Produces a stream of events by polling a provided function at a given rate. This rate is the minimum rate, not the exact rate (similar to setTimeout). The provided function is only polled when the previous execution has completed. This has the effect of making async calls execute in series.

### Features

* Can poll promises, callback functions, and regular functions.
* Pollify is non-blocking. Will continuously poll a synchronous function in a non-blocking way.
* Handles whether to use setTimeout or setImmediate for you.

## Installation

```sh
npm install pollify
```

## Usage

**poll.start() must be called before polling starts.**

### Pollify a function

```javascript
const Pollify = require('pollify');

function fn(arg1, arg2, cb) { ... }
let poll = new Pollify({ rate: 1000, mode: 'callback' }, fn, arg1, arg2);
```

`Pollify(options, pollFn, arg1, arg2, ...)`

* `options.rate` the rate with which to poll pollFn
* `options.mode` the return type of pollFn
  * Can be `callback`, `promise`, or `return` for regular functions
* `pollFn` the function to be polled
* `arg1, arg2, ...` the arguments with which to call pollFn with

### Listen for polled data

```javascript
poll.on('data', (data, timestamp) => { ... });
```

### Listen for errors from the polled function

```javascript
poll.on('error', (e) => { ... });
```

### Stop and start the poll

```javascript
poll.stop();
poll.start();
```

## But Why

Recently worked on a project where I needed to poll async functions in series. Made this for convenience and decided to share it.
