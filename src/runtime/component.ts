import { reactive, effect } from '../reactivity';
import { normalizeVnode } from './vnode';
import { patch } from './render';
import { queueJob } from './scheduler';
import type { TypeComponentVnode, TypeVnode } from './vnode';
import type { VElement, VChildNode } from './render';
import type { EffectFn } from '../reactivity';

export type Instance = {
	props: Record<string, any>;
	attrs: Record<string, any>;
	setupState: Record<string, any> | null;
	ctx: Record<string, any> | null;
	subTree: TypeVnode | null;
	update: null | EffectFn;
	isMounted: boolean;
	next: TypeComponentVnode | null;
};

export function mountComponent(
	vnode: TypeComponentVnode,
	container: HTMLElement,
	anchor: VElement | VChildNode | null = null
) {
	const { type: Component } = vnode;

	const instance: Instance = (vnode.component = {
		props: {},
		attrs: {},
		setupState: null,
		ctx: null,
		subTree: null,
		update: null,
		isMounted: false,
		next: null
	});

	updateProps(instance, vnode);

	// 源码：instance.setupState = proxyRefs(setupResult)
	// TODO
	instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs });

	// 源码：对ctx做了一个代理，先再props里面找，再到setupSate里面找
	// TODO
	instance.ctx = {
		...instance.props,
		...instance.setupState
	};

	instance.update = effect(
		() => {
			if (!instance.isMounted) {
				instance.subTree = normalizeVnode(Component.render(instance.ctx));
				fallThrough(instance, instance.subTree);
				patch(null, instance.subTree, container, anchor);
				instance.isMounted = true;
				vnode.el = instance.subTree.el;
			} else {
				if (instance.next) {
					vnode = instance.next;
					instance.next = null;
					updateProps(instance, vnode);
					instance.ctx = {
						...instance.props,
						...instance.setupState
					};
				}
			}

			const prev = instance.subTree;
			instance.subTree = normalizeVnode(Component.render(instance.ctx));

			fallThrough(instance, instance.subTree);

			patch(prev, instance.subTree, container, anchor);
			vnode.el = instance.subTree.el;
		},
		{
			lazy: true,
			scheduler(fn) {
				queueJob(fn);
			}
		}
	) as EffectFn;

	instance.update();
}

function updateProps(instance: Instance, vnode: TypeComponentVnode) {
	const { type: Component, props: vnodeProps } = vnode;
	for (const key in vnodeProps) {
		if (Component.props?.includes(key)) {
			instance.props[key] = vnodeProps[key];
		} else {
			instance.attrs[key] = vnodeProps[key];
		}
	}
	instance.props = reactive(instance.props);
}

function fallThrough(instance: Instance, subTree: TypeVnode) {
	if (Object.keys(instance.attrs).length) {
		subTree.props = {
			...subTree.props,
			...instance.attrs
		};
	}
}
