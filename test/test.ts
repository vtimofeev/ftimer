/// <reference path="../src/ft/timer.ts" />
/// <reference path="../typings/tsd.d.ts" />

import { assert } from 'chai';
import { ft , ftimer } from '../src/ft/timer';

describe('ftimer light', function () {
    var counters = { delay: 0, interval: 0, complete: 0, catch: 0 };

    function reset() {
        counters = { delay: 0, interval: 0, complete: 0, catch: 0 };
    }

    function increment(name) {
        counters[name]++;
    }

    function error() {
        throw 'Test error caused by application';
    }



    it('Executions delay/interval tests', (done)=>{
        var ft0 = ftimer.get()
            .delay(0)
            .then(increment.bind(null, 'delay'))
            .interval(0,2, increment.bind(null, 'interval'))
            .then(increment.bind(null, 'complete'));

        setTimeout(directAssert, 150);
        setTimeout(reverseAssert, 300);

        function directAssert():void {
            console.log(JSON.stringify(counters));
            assert.strictEqual(counters.delay, 1, 'Delay value must be equals');
            assert.strictEqual(counters.interval, 2, 'Intervals values must be equals');
            assert.strictEqual(counters.complete, 1, 'Complete value must be equal');
            ft0.reverse();
        }

        function reverseAssert():void {
            console.log(JSON.stringify(counters));
            assert.strictEqual(counters.delay, 2, 'Delay value must be equals');
            assert.strictEqual(counters.interval, 4, 'Intervals values must be equals');
            assert.strictEqual(counters.complete, 2, 'Complete value must be equal');
        }

        setTimeout(done, 350);

    });

    it('Executions delay/interval tests', (done)=> {
        var count = 0,
            ft0 = ftimer.get()
            .delay(0)
            .then(increment.bind(null, 'delay'))
            .loop();

        function assertHandler() {
            ft0.unloop().stop();
            count = counters.delay;
            assert(counters.delay >= 3, 'Counter of loop must be more then 3 after 150 ms: actual is ' + counters.delay);
            done();
        }

        reset();
        setTimeout(assertHandler, 150);

    });
});



