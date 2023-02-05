export function isObject(value: any) {
	return typeof value === 'object' && value !== null;
}

export function isFunction(value: any) {
	return typeof value === 'function';
}

export function isArray(value: any) {
	return Array.isArray(value);
}

export function isString(value: any) {
	return typeof value === 'string';
}

export function isNumber(value: any) {
	return typeof value === 'number';
}

export function hasChanged(oldValue: any, value: any) {
	return value !== oldValue && (value === value || oldValue === oldValue);
}

const camelizeRE = /-(\w)/g;
export function camelize(str: string) {
	return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
}

export function capitalize(str: string) {
	return str[0].toUpperCase() + str.slice(1);
}
