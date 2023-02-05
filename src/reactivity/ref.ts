import { hasChanged, isObject } from '../utils/index';
import { track, trigger } from './effect';
import { reactive } from './reactive';

export function ref(value: any) {
	if (isRef(value)) return value;
	return new RefImpl(value);
}

export function isRef(value: any) {
	return !!(value && value.__isRef);
}

class RefImpl {
	_value: any;
	__isRef: boolean;

	constructor(value: any) {
		this._value = convert(value);
		this.__isRef = true;
	}

	get value() {
		track(this, 'value');
		return this._value;
	}
	set value(newValue) {
		if (hasChanged(this._value, newValue)) {
			this._value = newValue;
			trigger(this, 'value');
		}
	}
}

function convert(value: any) {
	return isObject(value) ? reactive(value) : value;
}
