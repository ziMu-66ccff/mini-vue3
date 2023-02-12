export function patchProps(
	el: HTMLElement,
	oldProps: Record<string, any> | null,
	newProps: Record<string, any> | null
) {
	if (oldProps === newProps) return;
	oldProps = oldProps || {};
	newProps = newProps || {};
	for (const prop in newProps) {
		if (prop === 'key') continue;
		const prev = oldProps[prop];
		const next = newProps[prop];
		if (prev !== next) {
			patchDomProps(el, prop, prev, next);
		}
		for (const prop in oldProps) {
			if (prop != 'key' && !(prop in newProps)) patchDomProps(el, prop, prev, null);
		}
	}
}

function patchDomProps(el: HTMLElement, key: string, prev: any, next: any) {
	switch (key) {
		case 'class':
			el.className = next || '';
			break;
		case 'style':
			if (!next) {
				el.removeAttribute('style');
			} else {
				for (const styleName in next) {
					el.style[styleName as any] = next[styleName];
				}
				if (prev) {
					for (const styleName in prev) {
						if (!(styleName in next)) {
							el.style[styleName as any] = '';
						}
					}
				}
			}
			break;
		default:
			if (/^on[^a-z]/.test(key)) {
				if (prev !== next) {
					const eventName = key.slice(2).toLowerCase();
					if (prev) {
						el.removeEventListener(eventName, prev);
					}
					if (next) {
						el.addEventListener(eventName, next);
					}
				}
			} else if (domPropsRE.test(key)) {
				if (next === '' && typeof (el as any)[key] === 'boolean') {
					next = true;
				}
				(el as any)[key] = next;
			} else {
				if (next == null || next == false) {
					el.removeAttribute(key);
				} else {
					el.setAttribute(key, next);
				}
			}
			break;
	}
}

const domPropsRE = /[A-Z]|^(value|checked|selected|muted|disabled)$/;
