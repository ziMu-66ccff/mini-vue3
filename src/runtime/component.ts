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
		props: {}, // 组件声明的props
		attrs: {}, // 传递给组件的，但是组件没有声明的属性
		setupState: null, // setup函数返回的数据对象
		ctx: null, // 传递给组件的render函数作为参数的数据对象
		subTree: null, // 虚拟dom树
		update: null, // 组件的更新函数
		isMounted: false, // 判断是否需要挂载的标志变量
		next: null // 存储新的组件虚拟dom
	});

	updateProps(instance, vnode);

	// 源码：instance.setupState = proxyRefs(setupResult)
	// TODO
	instance.setupState = Component.setup?.(instance.props, { attrs: instance.attrs, emit });

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

				const prev = instance.subTree;
				instance.subTree = normalizeVnode(Component.render(instance.ctx));

				fallThrough(instance, instance.subTree);

				patch(prev, instance.subTree, container, anchor);
				vnode.el = instance.subTree.el;
			}
		},
		{
			lazy: true,
			scheduler(fn) {
				queueJob(fn);
			}
		}
	) as EffectFn;

	instance.update();

	function emit(event: string, ...payload: any[]) {
		const eventName = `on${event[0].toUpperCase() + event.slice(1)}`;
		const handler = instance.props[eventName];
		if (handler) {
			handler(...payload);
		} else {
			console.error('事件处理函数不存在');
		}
	}
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
	// 对props进行响应式处理
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
