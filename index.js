'use strict';

const _ = require( 'lodash' ),
    EventEmitter = require( 'events' );


const _emit = Symbol( 'emit' ),
    _poll = Symbol( 'poll' ),
    _repoll = Symbol( 'repoll' ),
    _typeMethods = {
        promise: Symbol( 'typePromise' ),
        callback: Symbol( 'typeCallback' ),
        return: Symbol( 'typeReturn' )
    },
    defaultOpts = {
        rate: 0,
        mode: 'callback'
    };


class Pollify extends EventEmitter {

    constructor( options, pollCb, ...args ) {
        super();

        const self = this;

        self.pollCb = _.partial( pollCb, ...args );
        self.options = _.merge( {}, defaultOpts, options );
        self.stopped = true;
        self.firstRun = true;

        // Normalize Mode
        self.options.mode = String( self.options.mode ).toLowerCase();
    }


    [ _typeMethods.promise ]( startTime ) {
        const self = this,
              req = self.pollCb().then( data => {
                  self[ _emit ]( 'data', data, startTime );
              }).catch( e => self[ _emit ]( 'error', e ) );

        // eslint-disable-next-line promise/catch-or-return
        req.then( () => self[ _repoll ]( startTime ) );
    }

    [ _typeMethods.callback ]( startTime ) {
        const self = this,
            cbFn = ( err, ...data ) => {

                if ( err ) {
                    return self[ _emit ]( 'error', err );
                }

                self[ _emit ]( 'data', ...data, startTime );
                self[ _repoll ]( startTime );
            };

        self.pollCb( cbFn );
    }

    [ _typeMethods.return ]( startTime ) {
        const self = this;

        try {
            const data = self.pollCb();
            self[ _emit ]( 'data', data, startTime );
        } catch ( e ) {
            self[ _emit ]( 'error', e );
        }

        self[ _repoll ]( startTime );
    }

    [ _emit ]( ...args ) {
        const self = this;

        if ( self.firstRun ) {
            return process.nextTick( () => self[ _emit ]( ...args ) );
        }

        return self.emit( ...args );
    }

    [ _poll ]() {
        const self = this;

        if ( self.stopped ) {
            return;
        }

        const method = _typeMethods[ self.options.mode ],
            startTime = process.hrtime();

        self[ method ]( startTime );
        self.firstRun = false;
    }

    [ _repoll ]( startTime ) {
        const self = this,
            endTime = _.last( process.hrtime( startTime ) ),
            timeDiff = self.options.rate - ( endTime / 1e6 );

        if ( timeDiff > 0 ) {
            self.timeout = setTimeout( self[ _poll ].bind( self ), timeDiff );
            return self.timeout;
        }

        return setImmediate( self[ _poll ].bind( self ) );
    }

    start() {
        const self = this;

        if ( self.stopped ) {
            self.stopped = false;

            self[ _poll ]();
        }
    }

    stop() {
        const self = this;
        clearTimeout( self.timeout );
        self.stopped = true;
    }
}


module.exports = Pollify;
