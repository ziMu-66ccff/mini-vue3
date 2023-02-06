import { effect } from './effect';
import type { EffectFn } from './effect';
import type { WatchOptions } from './watch';

export function watchEffect(
	cb: (onInvalidate?: (fn: () => void) => void) => void,
	options: WatchOptions
) {
	let clearUp: (() => void) | undefined = undefined;

	const job = () => {
		if (clearUp) clearUp();
		cb(onInvalidate);
	};

	function onInvalidate(fn: () => void) {
		clearUp = fn;
	}

	const effectFn = effect(() => cb(), {
		lazy: true,
		scheduler() {
			job();
		}
	}) as EffectFn;

	effectFn();
}
