import { isString } from '../utils/index';
import { render } from './render';
import { h } from './vnode';

export function createApp(rootComponent: Record<string, any>) {
	const app = {
		mount(rootContainer: HTMLElement | string) {
			if (isString(rootContainer)) {
				if (document.querySelector(rootContainer)) {
					rootContainer = document.querySelector(rootContainer) as HTMLElement;
				} else {
					return;
				}
			}
			render(h(rootComponent, null, null), rootContainer as HTMLElement);
		}
	};
}
