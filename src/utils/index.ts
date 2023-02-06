export function isObject(value: any): value is Record<string | number | symbol, any> {
	return typeof value === 'object' && value !== null;
}

export function isFunction(value: any): value is () => any {
	return typeof value === 'function';
}

export function isArray(value: any): value is any[] {
	return Array.isArray(value);
}

export function isString(value: any): value is string {
	return typeof value === 'string';
}

export function isNumber(value: any): value is number {
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
