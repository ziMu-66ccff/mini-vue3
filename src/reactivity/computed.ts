import { isFunction } from '../utils/index';
import { effect, track, trigger } from './effect';
import type { EffectFn } from './effect';

type computedOptions = { getter: () => any; setter: (newValue?: any) => void; (): any };

export function computed(computedOptions: computedOptions) {
	let getter: () => any;
	let setter: (newValue?: any) => void;

	if (isFunction(computedOptions)) {
		getter = computedOptions;
		setter = () => {
			console.warn('Write operation failed: computed value is readonly');
		};
	} else {
		getter = computedOptions.getter;
		setter = computedOptions.setter;
	}

	return new computedRefImpl(getter, setter);
}

class computedRefImpl {
	_value: any;
	_isDirty: boolean;
	_setter: (newValue?: any) => void;
	_effectFn: EffectFn;

	constructor(getter: () => any, setter: (newValue?: any) => void) {
		this._value = undefined;
		this._isDirty = true;
		this._setter = setter;
		this._effectFn = effect(getter, {
			lazy: true,
			scheduler: (fn) => {
				if (!this._isDirty) {
					this._isDirty = true;
					trigger(this, 'value');
				}
			}
		}) as EffectFn;
	}

	get value() {
		if (this._isDirty) {
			this._value = this._effectFn();
			this._isDirty = false;
			track(this, 'value');
		}
		return this._value;
	}

	set value(newValue) {
		this._setter(newValue);
	}
}
