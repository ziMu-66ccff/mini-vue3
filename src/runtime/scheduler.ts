import type { EffectFn } from '../reactivity';

const jobQueue = new Set<EffectFn>();
const resolvedPromise = Promise.resolve();
let currentFlushPromise: any = null;
let isFlush = false;

export function nextTick(fn: any) {
	const p = currentFlushPromise || resolvedPromise;
	return fn ? p.then(fn) : p;
}

export function queueJob(fn: EffectFn) {
	jobQueue.add(fn);
	flushJob();
}

function flushJob() {
	if (isFlush) return;
	isFlush = true;
	currentFlushPromise = resolvedPromise
		.then(() => {
			jobQueue.forEach((fn) => fn());
		})
		.finally(() => {
			isFlush = false;
			currentFlushPromise = null;
		});
}
