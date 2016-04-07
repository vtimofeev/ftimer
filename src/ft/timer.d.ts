export declare module ft {
    interface ITimerManagerOpts {
        GCStep: number;
    }
    class TimerManager {
        private items;
        private interval;
        private state;
        private opts;
        count: number;
        static now: number;
        constructor(minIntervalMs: number, opts?: ITimerManagerOpts);
        private execute();
        get(context?: any, name?: string): Timer;
        dispose(): void;
    }
    class Timer {
        private name;
        context: any;
        state: number;
        nextExecution: number;
        private startTime;
        private taskIndex;
        private tasks;
        private result;
        private _value;
        forward: boolean;
        looped: boolean;
        constructor(name: string, context?: any);
        now: number;
        timeFromStart: number;
        val(value?: any): Timer;
        value(value?: any): any;
        delay(value: number): Timer;
        interval(value: number, count?: number, handler?: Function): this;
        then(successHandler: any, errorHandler: any): Timer;
        getTask(): any;
        isActive(): boolean;
        getNext(): number;
        hasNext(): boolean;
        tryNext(): void;
        start(): void;
        reverse(): void;
        loop(): Timer;
        unloop(): Timer;
        stop(): void;
        execute(): void;
        tryPromise(): void;
        promiseResolve(v: any): void;
        promiseReject(v: any): void;
        dispose(): void;
    }
    function getTimerManager(tick?: number, opts?: ITimerManagerOpts): TimerManager;
    var timer: TimerManager;
}
export declare var ftimer: ft.TimerManager;
