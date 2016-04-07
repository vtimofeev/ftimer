FTIMER 0.1.0 - Advanced Timer (beta)
Has TypeScript definitions.

Using with NodeJS:

```

var ftimer = require('ftimer').ftimer; // get default timer factory/manager

var timer = ftimer.get() // get timer instance
       .delay(100) // wait 100 milliseconds
       .then(incrementFunctionThatReturnPromise) // then execute function and wait for a promise resolve/reject
       .interval(100, 2, decrementFunction) // then execute function 2 times with 100 milliseconds interval
       .loop(); // infinity repeat 

timer.start(); // start/resume timer
timer.stop(); // stop timer
timer.dispose(); // destroy current timer

ftimer.dispose(); // destroy factory and all timers

var ftimer50 = require('ftimer').ft.getTimerManager(50); // get timer factory/manager that has step 50 milliseconds

var timer50 = ftimer50.get() // get timer instance
            .delay(10) // wait 50 milliseconds cause step execution is 50 milliseconds
            .then(incrementFunctionThatReturnPromise) // then execute function and wait for a promise resolve/reject
            
timer50.then(decrementPromise); // you can `async` add task to execute function            
           
```


