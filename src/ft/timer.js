if (typeof exports === 'undefined')
    var exports = window || {};
var ft;
(function (ft) {
    var TimerState = {
        NONE: 0,
        ACTIVE: 1,
        EXECUTING: 2,
        DISPOSED: 3
    };
    var Task = {
        GET: 0,
        DELAY: 1,
        INTERVAL: 2,
        THEN: 3
    };
    var Opts = {
        GCStep: 1500
    };
    var TimerManager = (function () {
        function TimerManager(minIntervalMs, opts) {
            if (opts === void 0) { opts = Opts; }
            this.items = [];
            this.interval = 0;
            this.state = TimerState.ACTIVE;
            this.count = 0;
            var execute = this.execute.bind(this);
            this.opts = opts;
            this.interval = setInterval(execute, minIntervalMs);
        }
        TimerManager.prototype.execute = function () {
            TimerManager.now = Date.now();
            this.count++;
            this.items.forEach(function (item) {
                if (item.state === TimerState.ACTIVE
                    && item.nextExecution < TimerManager.now)
                    item.execute();
            });
            if (this.count % this.opts.GCStep === 0) {
                this.items = this.items.filter(function (item) {
                    return item.state != TimerState.DISPOSED;
                });
            }
        };
        TimerManager.prototype.get = function (context, name) {
            if (this.state === TimerState.DISPOSED)
                throw 'TimerManages is disposed';
            name = name || (typeof context === 'string' ? context : null) || 't' + Math.round(Math.random() * 10e9).toString(36);
            var item = new Timer(name, context);
            this.items.push(item);
            return item;
        };
        TimerManager.prototype.dispose = function () {
            this.state = TimerState.DISPOSED;
            clearInterval(this.interval);
        };
        TimerManager.now = Date.now();
        return TimerManager;
    })();
    ft.TimerManager = TimerManager;
    var Timer = (function () {
        function Timer(name, context) {
            this.startTime = +new Date(); //@debug
            this.result = true;
            this._value = null;
            this.forward = true;
            this.looped = false;
            this.name = name;
            this.context = context;
            this.taskIndex = -1;
            this.tasks = [];
            this.state = TimerState.NONE;
        }
        Object.defineProperty(Timer.prototype, "now", {
            get: function () {
                return TimerManager.now;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Timer.prototype, "timeFromStart", {
            get: function () {
                return (+new Date() - this.startTime);
            },
            enumerable: true,
            configurable: true
        });
        Timer.prototype.val = function (value) {
            this.value(value);
            return this;
        };
        Timer.prototype.value = function (value) {
            if (value !== undefined) {
                this._value = value;
                this.result ? this.tryPromise() : this.tryNext();
            }
            return this._value;
        };
        Timer.prototype.delay = function (value) {
            this.tasks.push({ type: Task.DELAY, time: value });
            this.tryNext();
            return this;
        };
        Timer.prototype.interval = function (value, count, handler) {
            if (count === void 0) { count = 0; }
            this.tasks.push({ type: Task.INTERVAL, time: value, count: count, executed: 0, handler: handler });
            this.tryNext();
            return this;
        };
        Timer.prototype.then = function (successHandler, errorHandler) {
            this.tasks.push({ type: Task.THEN, time: 0, value: [successHandler, errorHandler] });
            this.tryNext();
            return this;
        };
        Timer.prototype.getTask = function () {
            return this.tasks[this.taskIndex];
        };
        Timer.prototype.isActive = function () {
            return this.state === TimerState.ACTIVE;
        };
        Timer.prototype.getNext = function () {
            var result = this.taskIndex + (this.forward ? 1 : -1), length = this.tasks.length;
            result = this.looped && result < 0 ? length - 1 : result;
            result = this.looped && result >= length ? 0 : result;
            return result;
        };
        Timer.prototype.hasNext = function () {
            return this.looped || (this.forward ? this.tasks.length && (this.taskIndex + 1) < this.tasks.length : (this.taskIndex - 1) >= 0);
        };
        Timer.prototype.tryNext = function () {
            if (this.isActive() || !this.hasNext())
                return;
            this.taskIndex = this.getNext();
            this.state = TimerState.ACTIVE;
            this.nextExecution = this.now + this.getTask().time;
        };
        Timer.prototype.start = function () {
            this.state = TimerState.ACTIVE;
            return this;
        };
        Timer.prototype.reverse = function () {
            this.forward = false;
            this.state = TimerState.ACTIVE;
            this.nextExecution = this.now + this.tasks[this.taskIndex].time;
        };
        Timer.prototype.loop = function () {
            this.looped = true;
            this.tryNext();
            return this;
        };
        Timer.prototype.unloop = function () {
            this.looped = false;
            return this;
        };
        Timer.prototype.stop = function () {
            this.state = TimerState.NONE;
            return this;
        };
        Timer.prototype.execute = function () {
            var task = this.tasks[this.taskIndex], successFunction, errorFunction, isFnc, fncResult;
            this.state = TimerState.EXECUTING;
            switch (task.type) {
                case Task.THEN:
                    successFunction = task.value[0];
                    errorFunction = task.value[1];
                    if (this.result) {
                        isFnc = successFunction instanceof Function;
                        fncResult = isFnc ? successFunction.apply(this.context, this.value()) : successFunction;
                        this.value(fncResult || null);
                    }
                    else {
                        isFnc = errorFunction instanceof Function;
                        fncResult = isFnc ? errorFunction.apply(this.context, this.value) : errorFunction;
                        this.value(fncResult || null);
                    }
                    break;
                case Task.DELAY:
                    this.tryNext();
                    break;
                case Task.INTERVAL:
                    task.executed = task.executed + (this.forward ? 1 : -1);
                    if (task.handler && task.handler instanceof Function) {
                        task.handler.apply(this.context, this.value);
                    }
                    if (this.forward && task.count > 0 && task.executed >= task.count) {
                        this.tryNext();
                    }
                    else if (!this.forward && task.executed <= 0) {
                        this.tryNext();
                    }
                    else {
                        this.nextExecution = this.now + this.tasks[this.taskIndex].time;
                        this.state = TimerState.ACTIVE;
                    }
            }
        };
        Timer.prototype.tryPromise = function () {
            if (this._value && this._value.then) {
                this._value.then(this.promiseResolve, this.promiseReject);
            }
            else {
                this.tryNext();
            }
        };
        Timer.prototype.promiseResolve = function (v) {
            this.value(v);
        };
        Timer.prototype.promiseReject = function (v) {
            this.result = false;
            this.value(v);
        };
        Timer.prototype.dispose = function () {
            this.state = TimerState.DISPOSED;
            this.tasks.forEach(function (task) { if (task.handler)
                delete task.handler; });
            this.context = null;
        };
        return Timer;
    })();
    ft.Timer = Timer;
    function getTimerManager(tick, opts) {
        if (tick === void 0) { tick = 20; }
        return new TimerManager(tick, opts);
    }
    ft.getTimerManager = getTimerManager;
    ft.timer = ft.getTimerManager(20);
})(ft = exports.ft || (exports.ft = {}));
exports.ftimer = ft.timer;
//# sourceMappingURL=timer.js.map