import { parse } from './SafeJson.js';
import echarts from './echarts.js';
echarts.setCanvasCreator(() => new OffscreenCanvas(32, 32));
const ctx = self;
const events = new class WorkerEventHandler {
    constructor() {
        this.plot = null;
    }
    init(canvas, theme, opts) {
        if (this.plot)
            throw new Error('Has been initialized');
        ctx.devicePixelRatio = opts.devicePixelRatio;
        const plot = this.plot = echarts.init(canvas, theme, opts);
        plot._api.saveAsImage = async (opts) => {
            ctx.postMessage(['saveAsImage', opts]);
        };
    }
    addEventListener(type) {
        this.plot.off(type);
        return this.plot.on(type, params => {
            params.event = undefined;
            ctx.postMessage(['event', params]);
        });
    }
    removeEventListener(type) {
        return this.plot.off(type);
    }
    event(type, eventInitDict) {
        return this.plot.getDom()
            .dispatchEvent(Object.assign(new Event(type), eventInitDict));
    }
    callMethod(methodName, ...args) {
        return this.plot[methodName](...args);
    }
    setOption(json, ...args) {
        return this.plot.setOption(parse(json), ...args);
    }
    dispose() {
        this.plot.dispose();
        this.plot = null;
    }
}();
ctx.open = (...args) => {
    ctx.postMessage(['open', args]);
};
ctx.onmessage = msg => {
    try {
        ctx.postMessage(['resolve', events[msg.data.type](...msg.data.args)]);
    }
    catch (e) {
        if (e instanceof Error) {
            ctx.postMessage(['error', [e.name, e.message, e.stack]]);
        }
        else {
            ctx.postMessage(['reject', e]);
        }
    }
};
//# sourceMappingURL=renderer.worker.js.map