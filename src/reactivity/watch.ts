import { isFunction } from '../utils/index';
import { effect } from './effect';
import type { EffectFn } from './effect';

export type WatchOptions = {
	immediate?: boolean;
	flush?: 'flush';
};

export function watch(
	source: {} | (() => any),
	cb: (oldValue?: any, newValue?: any, onInvalidate?: (fn: () => void) => void) => void,
	options?: WatchOptions
) {
	let getter: () => any;
	let oldValue: any;
	let newValue: any;
	let clearUp: (() => any) | undefined = undefined;

	if (isFunction(source)) {
		getter = source;
	} else {
		getter = () => traverse(source);
	}

	function onInvalidate(fn: () => void) {
		clearUp = fn;
	}

	const effectFn = effect(() => getter(), {
		lazy: true,
		scheduler() {
			if (options?.flush) {
				// To do
			} else {
				job();
			}
		}
	}) as EffectFn;

	const job = () => {
		newValue = effectFn();
		if (clearUp) clearUp();
		cb(oldValue, newValue, onInvalidate);
		oldValue = newValue;
	};

	if (options?.immediate) {
		job();
	} else {
		oldValue = effectFn();
	}
}

function traverse(value: any, seen: Set<any> = new Set()) {
	if (typeof value !== 'object' || value === null || seen.has(value)) return;
	seen.add(value);
	for (let k in value) {
		traverse(value[k], seen);
	}
	return value;
}
