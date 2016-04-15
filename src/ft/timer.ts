
if(typeof exports === 'undefined') var exports = window || {};

export module ft {

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

    var Opts:ITimerManagerOpts = {
        GCStep: 1500
    };

    export interface ITimerManagerOpts {
        GCStep:number;
    }

    export class TimerManager {
        private items:Array<Timer> = [];
        private interval:number = 0;
        private state:number = TimerState.ACTIVE;
        private opts:ITimerManagerOpts;

        public count:number = 0;
        public static now:number = Date.now();

        constructor(minIntervalMs:number, opts:ITimerManagerOpts = Opts) {
            var execute = this.execute.bind(this);
            this.opts = opts;
            this.interval = setInterval(execute, minIntervalMs)
        }

        private execute() {
            TimerManager.now = Date.now();
            this.count++;

            this.items.forEach(function (item:Timer) {
                if (item.state === TimerState.ACTIVE
                    && item.nextExecution < TimerManager.now) item.execute();
            });

            if (this.count % this.opts.GCStep === 0) {
                this.items = this.items.filter(function (item:Timer) {
                    return item.state != TimerState.DISPOSED;
                })
            }
        }

        get(context?:any, name?:string):Timer {
            if(this.state === TimerState.DISPOSED) throw 'TimerManages is disposed';
            name = name || (typeof context === 'string' ? context : null ) || 't' + Math.round(Math.random()*10e9).toString(36);
            var item:Timer = new Timer(name, context);
            this.items.push(item);
            return item;
        }

        dispose() {
            this.state = TimerState.DISPOSED;
            clearInterval(this.interval);
        }
    }

    export class Timer {
        private name:string;
        context:any;
        state:number;
        nextExecution:number;

        private startTime:number = +new Date(); //@debug
        private taskIndex:number;
        private tasks:any[];
        private result:boolean = true;
        private _value:any = null;

        forward:boolean = true;
        looped:boolean = false;

        constructor(name:string, context?:any) {
            this.name = name;
            this.context = context;
            this.taskIndex = -1;
            this.tasks = [];
            this.state = TimerState.NONE;
        }

        get now():number {
            return TimerManager.now;
        }

        get timeFromStart():number {
            return (+new Date() - this.startTime);
        }

        val(value?:any):Timer {
            this.value(value);
            return this;
        }

        value(value?:any):any {
            if (value !== undefined) {
                this._value = value;
                this.result ? this.tryPromise() : this.tryNext();
            }

            return this._value;
        }

        delay(value:number):Timer {
            this.tasks.push({type: Task.DELAY, time: value});
            this.tryNext();
            return this;
        }

        interval(value:number, count:number = 0, handler?:Function) {
            this.tasks.push({type: Task.INTERVAL, time: value, count: count, executed: 0, handler: handler});
            this.tryNext();
            return this;
        }

        then(successHandler, errorHandler):Timer {
            this.tasks.push({type: Task.THEN, time: 0, value: [successHandler, errorHandler]});
            this.tryNext();
            return this;
        }

        getTask() {
            return this.tasks[this.taskIndex];
        }

        isActive():boolean {
            return this.state === TimerState.ACTIVE;
        }

        getNext():number {
            var result:number = this.taskIndex + (this.forward ? 1 : -1),
                length:number = this.tasks.length;

            result = this.looped && result < 0 ? length - 1: result;
            result = this.looped && result >= length ? 0 : result;

            return result;
        }

        hasNext() {
            return this.looped || (this.forward ? this.tasks.length && (this.taskIndex + 1) < this.tasks.length : (this.taskIndex - 1) >= 0);
        }


        tryNext() {
            if (this.isActive() || !this.hasNext()) return;
            this.taskIndex = this.getNext();
            this.state = TimerState.ACTIVE;
            this.nextExecution = this.now + this.getTask().time;
        }

        start():Timer {
            this.state = TimerState.ACTIVE;
            return this;
        }

        reverse():void {
            this.forward = false;
            this.state = TimerState.ACTIVE;
            this.nextExecution = this.now + this.tasks[this.taskIndex].time;
        }

        loop():Timer {
            this.looped = true;
            this.tryNext();
            return this;
        }

        unloop():Timer {
            this.looped = false;
            return this;
        }

        stop():Timer {
            this.state = TimerState.NONE;
            return this;
        }

        execute():void {

            var task = this.tasks[this.taskIndex],
                successFunction,
                errorFunction,
                isFnc,
                fncResult;

            this.state = TimerState.EXECUTING;

            switch (task.type) {
                case Task.THEN:
                    successFunction = task.value[0];
                    errorFunction = task.value[1];

                    if (this.result) {
                        isFnc = successFunction instanceof Function;
                        fncResult = isFnc ? successFunction.apply( this.context, this.value() ) : successFunction;
                        this.value(fncResult || null );
                    }
                    else {
                        isFnc = errorFunction instanceof Function;
                        fncResult = isFnc ? errorFunction.apply(this.context, this.value) : errorFunction;
                        this.value( fncResult || null );
                    }

                    break;

                case Task.DELAY:
                    this.tryNext();
                    break;

                case Task.INTERVAL:
                    task.executed = task.executed + (this.forward?1:-1);

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
        }

        tryPromise() {
            if (this._value && this._value.then) {
                this._value.then(this.promiseResolve, this.promiseReject);
            }
            else {
                this.tryNext();
            }
        }

        promiseResolve(v) {
            this.value(v);
        }

        promiseReject(v) {
            this.result = false;
            this.value(v);
        }

        dispose():void {
            this.state = TimerState.DISPOSED;
            this.tasks.forEach((task:any)=>{ if(task.handler) delete task.handler; });
            this.context = null;
        }
    }

    export function getTimerManager(tick:number = 20, opts?:ITimerManagerOpts):TimerManager {
        return new TimerManager(tick, opts);
    }

    export var timer:TimerManager = ft.getTimerManager(20);
}

export var ftimer:ft.TimerManager = ft.timer;

