export type EffectFn = {
	(): any;
	deps: Array<Set<EffectFn>>;
	options?: Options;
};

type Options = {
	scheduler?: (fn: EffectFn) => void;
	lazy?: boolean;
};

let activeEffect: EffectFn;
const effectStarck: Array<EffectFn> = [];
const targetMap: WeakMap<object, Map<any, Set<EffectFn> | undefined> | undefined> = new WeakMap();

export function effect(fn: () => any, options?: Options) {
	const effectFn: EffectFn = () => {
		clearUp(effectFn);
		activeEffect = effectFn;
		effectStarck.push(effectFn);
		const res = fn();
		effectStarck.pop();
		activeEffect = effectStarck[effectStarck.length - 1];
		return res;
	};
	effectFn.deps = [] as Array<Set<EffectFn>>;
	effectFn.options = options;
	if (effectFn.options?.lazy) {
		return effectFn;
	}
	effectFn();
}

function clearUp(fn: EffectFn) {
	fn.deps?.forEach((deps) => {
		deps.delete(fn);
	});
}

export function track(target: {}, key: any) {
	if (!activeEffect) return;
	let depsMap = targetMap.get(target);
	if (!depsMap) targetMap.set(target, (depsMap = new Map()));
	let deps = depsMap.get(key);
	if (!deps) depsMap.set(key, (deps = new Set()));
	deps.add(activeEffect);
	activeEffect.deps.push(deps);
}

export function trigger(target: {}, key: any) {
	const depsMap = targetMap.get(target);
	if (!depsMap) return;
	const effects = depsMap.get(key);
	const effectsToRun: Set<EffectFn> = new Set();
	effects?.forEach((effectFn) => {
		if (effectFn !== activeEffect) {
			effectsToRun.add(effectFn);
		}
	});
	effectsToRun.forEach((effectFnToRun) => {
		if (effectFnToRun.options?.scheduler) {
			effectFnToRun.options.scheduler(effectFnToRun);
		} else {
			effectFnToRun();
		}
	});
}
