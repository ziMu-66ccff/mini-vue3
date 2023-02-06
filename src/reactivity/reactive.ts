import { isArray, isObject, hasChanged } from '../utils/index';
import { track, trigger } from './effect';

const reactiveMap = new WeakMap();

export function reactive(target: any) {
	if (!isObject(target)) return target;
	if (isReactive(target)) return target;
	if (reactiveMap.has(target)) return reactiveMap.get(target);

	const reactiveProxy: {} | any[] = new Proxy(target, {
		get(target, key): {} | any[] {
			if (key === 'isReactive') return true;
			track(target, key);
			const res = target[key];
			return isObject(res) ? reactive(res) : res;
		},
		set(target, key, newValue) {
			const oldValue = target[key];
			const oldLength = target.length;
			const res = Reflect.set(target, key, newValue);
			if (hasChanged(oldValue, newValue)) {
				trigger(target, key);
				if (isArray(target) && oldLength != Reflect.get(target, 'length')) {
					trigger(target, 'length');
				}
			}
			return res;
		}
	});

	reactiveMap.set(target, reactiveProxy);
	return reactiveProxy;
}

function isReactive(target: any) {
	return !!(target && target.__isReactive);
}
