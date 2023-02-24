import { ShapeFlags } from './vnode';
import { patchProps } from './patchProps';
import { mountComponent } from './component';
import type {
	TypeVnode,
	TypeElementVnode,
	TypeTextVnode,
	TypeComponentVnode,
	TypeFragmentVnode
} from './vnode';
import type { Instance } from './component';
import type { EffectFn } from '../reactivity';

export interface VElement extends HTMLElement {
	_vnode?: TypeVnode | null;
}
export interface VChildNode extends ChildNode {
	_vnode?: TypeVnode | null;
}

export function render(vnode: TypeVnode | null, container: VElement) {
	const prevVnode = container._vnode;
	if (vnode) {
		patch(prevVnode, vnode, container);
	} else {
		if (prevVnode) unmount(prevVnode);
	}
	container._vnode = vnode;
}

export function patch(
	oldVnode: TypeVnode | null | undefined,
	newVnode: TypeVnode,
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	if (oldVnode && !isSameVnodeType(oldVnode, newVnode) && oldVnode.el) {
		anchor = oldVnode.anchor || oldVnode.el.nextSibling;
		unmount(oldVnode);
		oldVnode = null;
	}

	const { ShapeFlag } = newVnode;
	if (ShapeFlag & ShapeFlags.ELEMENT) {
		processElement(
			oldVnode as TypeElementVnode | null | undefined,
			newVnode as TypeElementVnode,
			container,
			anchor
		);
	} else if (ShapeFlag & ShapeFlags.TEXT) {
		processText(
			oldVnode as TypeTextVnode | null | undefined,
			newVnode as TypeTextVnode,
			container,
			anchor
		);
	} else if (ShapeFlag & ShapeFlags.FRAGMENT) {
		processFragment(
			oldVnode as TypeFragmentVnode | null | undefined,
			newVnode as TypeFragmentVnode,
			container,
			anchor
		);
	} else if (ShapeFlag & ShapeFlags.COMPONENT) {
		processComponent(
			oldVnode as TypeComponentVnode | null | undefined,
			newVnode as TypeComponentVnode,
			container,
			anchor
		);
	}
}

function isSameVnodeType(oldVnode: TypeVnode, newVnode: TypeVnode) {
	return oldVnode.type === newVnode.type;
}

function processElement(
	oldVnode: TypeElementVnode | null | undefined,
	newVnode: TypeElementVnode,
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	if (!oldVnode) {
		mountElement(newVnode, container, anchor);
	} else {
		patchElement(oldVnode, newVnode);
	}
}
function processText(
	oldVnode: TypeTextVnode | null | undefined,
	newVnode: TypeTextVnode,
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	if (!oldVnode) {
		mountText(newVnode, container, anchor);
	} else {
		newVnode.el = oldVnode.el;
		(newVnode.el as Text).textContent = newVnode.children as string;
	}
}
function processFragment(
	oldVnode: TypeFragmentVnode | null | undefined,
	newVnode: TypeFragmentVnode,
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	const fragmentStartAnchor = (newVnode.el = oldVnode
		? (oldVnode.el as Text)
		: document.createTextNode(''));
	const fragmentEndAnchor = (newVnode.anchor = oldVnode
		? (oldVnode.anchor as Text)
		: document.createTextNode(''));
	if (oldVnode == null) {
		container.insertBefore(fragmentStartAnchor, anchor);
		container.insertBefore(fragmentEndAnchor, anchor);
	} else {
		patchChildren(oldVnode, newVnode, container, fragmentEndAnchor);
	}
}
function processComponent(
	oldVnode: TypeComponentVnode | null | undefined,
	newVnode: TypeComponentVnode,
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	if (!oldVnode) mountComponent(newVnode, container, anchor);
	else {
		updateComponent(oldVnode, newVnode);
	}
}

function mountElement(
	vnode: TypeElementVnode,
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	const { type, props, ShapeFlag, children } = vnode;
	const el = (vnode.el = document.createElement(type));

	if (ShapeFlag & ShapeFlags.TEXT_CHILDREN) {
		el.textContent = children as string;
	} else if (ShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
		mountChildren(children as TypeVnode[], container, anchor);
	}

	if (props) {
		patchProps(el, null, props);
	}
	container.insertBefore(el, anchor);
}
function mountText(
	vnode: TypeTextVnode,
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	const textNode = document.createTextNode(vnode.children);
	vnode.el = textNode;
	container.insertBefore(textNode, anchor);
}
function mountChildren(
	children: TypeVnode[],
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	children.forEach((child) => {
		patch(null, child, container, anchor);
	});
}

function patchElement(oldVnode: TypeElementVnode, newVnode: TypeElementVnode) {
	newVnode.el = oldVnode.el as HTMLElement;
	// patchProps
	patchProps(newVnode.el, oldVnode.props, newVnode.props);
	patchChildren(oldVnode, newVnode, newVnode.el);
}
function patchChildren(
	oldVnode: TypeElementVnode | TypeComponentVnode | TypeFragmentVnode,
	newVnode: TypeElementVnode | TypeComponentVnode | TypeFragmentVnode,
	container: HTMLElement,
	anchor: VElement | VChildNode | null = null
) {
	const { ShapeFlag: prevShapeFlag, children: oldChildren } = oldVnode;
	const { ShapeFlag, children: newChildren } = newVnode;

	if (ShapeFlag & ShapeFlags.TEXT_CHILDREN) {
		if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			unmountChildren(oldChildren as TypeVnode[]);
		}
		if (oldChildren !== newChildren) {
			container.textContent = newChildren as string;
		}
	} else if (ShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
		if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			if (
				(oldChildren as TypeVnode[])[0] &&
				(oldChildren as TypeVnode[])[0].key &&
				(newChildren as TypeVnode[])[0] &&
				(newChildren as TypeVnode[])[0].key
			) {
				patchkeyChildren(oldChildren as TypeVnode[], newChildren as TypeVnode[], container, anchor);
			} else {
				patchUnkeyChildren(
					oldChildren as TypeVnode[],
					newChildren as TypeVnode[],
					container,
					anchor
				);
			}
		} else {
			container.textContent = '';
			mountChildren(newChildren as TypeVnode[], container, anchor);
		}
	} else {
		if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
			mountChildren(newChildren as TypeVnode[], container, anchor);
		}
		container.textContent = '';
	}
}
function patchUnkeyChildren(
	oldChildren: TypeVnode[],
	newChildren: TypeVnode[],
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	const oldLength = oldChildren.length;
	const newLength = newChildren.length;
	const commonLength = Math.min(oldLength, newLength);
	for (let i = 0; i < commonLength; i++) {
		patch(oldChildren[i], newChildren[i], container, anchor);
	}
	if (newLength > oldLength) mountChildren(newChildren.slice(commonLength), container, anchor);
	if (oldLength > newLength) unmountChildren(oldChildren.slice(commonLength));
}
function patchkeyChildren(
	oldChildren: TypeVnode[],
	newChildren: TypeVnode[],
	container: VElement,
	anchor: VElement | VChildNode | null = null
) {
	let j = 0;
	let newStartVnode = newChildren[j];
	let oldStartVnode = oldChildren[j];
	let newEndIndex = newChildren.length - 1;
	let oldEndIndex = oldChildren.length - 1;
	let newEndVnode = newChildren[newEndIndex];
	let oldEndVnode = oldChildren[oldEndIndex];

	while (newStartVnode.key === oldStartVnode.key) {
		patch(oldStartVnode, newStartVnode, container);
		j++;
		newStartVnode = newChildren[j];
		oldStartVnode = oldChildren[j];
	}
	while (newEndVnode.key === oldEndVnode.key) {
		patch(oldEndVnode, newEndVnode, container, anchor);
		newEndIndex--;
		oldEndIndex--;
		newEndVnode = newChildren[newEndIndex];
		oldEndVnode = oldChildren[oldEndIndex];
	}
	if (oldEndIndex < j && newEndIndex >= j) {
		const anchorIndex = newEndIndex + 1;
		const anchor = anchorIndex < newChildren.length ? newChildren[anchorIndex].el : null;
		while (j <= newEndIndex) {
			patch(null, newChildren[j++], container, anchor);
		}
	} else if (newEndIndex < j && oldEndIndex >= j) {
		while (j <= oldEndIndex) {
			unmount(oldChildren[j++]);
		}
	} else {
		const count = newEndIndex - j + 1;
		const source = new Array(count);
		const keyindex: Record<any, any> = {};
		let moved = false;
		let pos = 0;
		let patched = 0;
		source.fill(-1);

		for (let i = j; i <= newEndIndex; i++) {
			keyindex[newChildren[i].key] = i;
		}
		for (let i = j; i <= oldEndIndex; i++) {
			const oldVnode = oldChildren[i];
			if (patched <= count) {
				const k = keyindex[oldVnode.key];
				if (typeof k !== 'undefined') {
					const newVnode = newChildren[k];
					patch(oldVnode, newVnode, container, anchor);
					patched++;
					source[k - j] = i;
					if (k < pos) {
						moved = true;
					} else {
						pos = k;
					}
				} else {
					unmount(oldVnode);
				}
			} else {
				unmount(oldVnode);
			}
		}
		if (moved) {
			const seq = getSequence(source);
			let s = seq.length - 1;
			let i = count - 1;
			for (i; i >= 0; i--) {
				if (source[i] === -1) {
					const pos = i + j;
					const newVnode = newChildren[pos];
					const nextPos = pos + 1;
					anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
					patch(null, newVnode, container, anchor);
				} else if (source[i] !== s) {
					const pos = i + j;
					const newVnode = newChildren[pos];
					const nextPos = pos + 1;
					anchor = nextPos < newChildren.length ? newChildren[nextPos].el : null;
					container.insertBefore(newVnode.el as HTMLElement | Text, anchor);
				} else {
					s--;
				}
			}
		}
	}
}

function updateComponent(oldVnode: TypeComponentVnode, newVnode: TypeComponentVnode) {
	newVnode.component = oldVnode.component as Instance;
	newVnode.component.next = newVnode;
	(newVnode.component.update as EffectFn)();
}

function unmount(vnode: TypeVnode) {
	const { ShapeFlag, el } = vnode;
	if (ShapeFlag & ShapeFlags.COMPONENT) {
		unmountComponent(vnode as TypeComponentVnode);
	} else if (ShapeFlag & ShapeFlags.FRAGMENT) {
		unmountFragment(vnode as TypeFragmentVnode);
	} else {
		el?.parentNode?.removeChild(el);
	}
}

function unmountFragment(vnode: TypeFragmentVnode) {
	let { el: cur, anchor: end } = vnode;
	while (cur !== end) {
		const next = (cur as any).nextSibling;
		cur?.parentNode?.removeChild(cur);
		cur = next;
	}
	end?.parentNode?.removeChild(end);
}
function unmountComponent(vnode: TypeComponentVnode) {
	// TODO
}
function unmountChildren(children: TypeVnode[]) {
	children.forEach((child) => {
		unmount(child);
	});
}

// 求最长递增子序列
function getSequence(arr: any[]) {
	const p = arr.slice();
	const result = [0];
	let i, j, u, v, c;
	const len = arr.length;
	for (i = 0; i < len; i++) {
		const arrI = arr[i];
		if (arrI !== 0) {
			j = result[result.length - 1];
			if (arr[j] < arrI) {
				p[i] = j;
				result.push(i);
				continue;
			}
			u = 0;
			v = result.length - 1;
			while (u < v) {
				c = ((u + v) / 2) | 0;
				if (arr[result[c]] < arrI) {
					u = c + 1;
				} else {
					v = c;
				}
			}
			if (arrI < arr[result[u]]) {
				if (u > 0) {
					p[i] = result[u - 1];
				}
				result[u] = i;
			}
		}
	}
	u = result.length;
	v = result[u - 1];
	while (u-- > 0) {
		result[u] = v;
		v = p[v];
	}
	return result;
}
