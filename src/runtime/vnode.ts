import { isNumber, isString, isArray, isObject } from '../utils';
import { isReactive } from '../reactivity';
import type { Instance } from './component';

export type TypeText = typeof Text;
export type TypeFragment = typeof Fragment;

type BaseVnode = {
	props: Record<string, any> | null;
	key: any;
	ShapeFlag: number;
	anchor: HTMLElement | Text | null;
};
export interface TypeElementVnode extends BaseVnode {
	type: keyof HTMLElementTagNameMap;
	children: TypeVnode[] | string | null;
	el: HTMLElement | null;
}
export interface TypeComponentVnode extends BaseVnode {
	type: Record<string, any>;
	children: TypeVnode[] | string | null;
	component: Instance | null;
	el: HTMLElement | Text | null;
}
export interface TypeFragmentVnode extends BaseVnode {
	type: TypeFragment;
	el: Text | null;
	children: TypeVnode[] | string | null;
}
export interface TypeTextVnode {
	type: TypeText;
	ShapeFlag: number;
	children: string;
	el: Text | null;
	anchor: HTMLElement | null;
}
export interface TypeVnode extends BaseVnode {
	type: keyof HTMLElementTagNameMap | Record<string, any> | TypeText | TypeFragment;
	children: TypeVnode[] | string | number | null;
	el: HTMLElement | Text | null;
	component: Record<string, any> | null;
}

export const Text = Symbol('Text');
export const Fragment = Symbol('Fragment');

export const ShapeFlags = {
	ELEMENT: 1,
	TEXT: 1 << 1,
	FRAGMENT: 1 << 2,
	COMPONENT: 1 << 3,
	TEXT_CHILDREN: 1 << 4,
	ARRAY_CHILDREN: 1 << 5,
	CHILDREN: (1 << 4) | (1 << 5)
};

export function h(
	type: keyof HTMLElementTagNameMap | Record<string, any> | TypeText | TypeFragment,
	props: Record<string, any> | null,
	children: TypeVnode[] | string | number | null
): TypeVnode {
	let ShapeFlag: number;

	if (isString(type)) {
		ShapeFlag = ShapeFlags.ELEMENT;
	} else if (type === Text) {
		ShapeFlag = ShapeFlags.TEXT;
	} else if (type === Fragment) {
		ShapeFlag = ShapeFlags.FRAGMENT;
	} else {
		ShapeFlag = ShapeFlags.COMPONENT;
	}

	if (children) {
		if (isString(children) || isNumber(children)) {
			ShapeFlag |= ShapeFlags.TEXT_CHILDREN;
			children = String(children);
		} else {
			ShapeFlag |= ShapeFlags.ARRAY_CHILDREN;
		}
	}

	if (props) {
		if (isReactive(props)) props = Object.assign({}, props);
		if (props.style) {
			if (isReactive(props.style)) props.style = Object.assign({}, props.style);
		}
	}

	return {
		type,
		props,
		children,
		ShapeFlag,
		key: props && (props.key ? props.key : null),
		el: null,
		component: null,
		anchor: null
	};
}

export function normalizeVnode(result: any): TypeVnode {
	if (isArray(result)) return h(Fragment, null, result);
	if (isObject(result)) return result as TypeVnode;
	return h(Text, null, result.toString());
}
