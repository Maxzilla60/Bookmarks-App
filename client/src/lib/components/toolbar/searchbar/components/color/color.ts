import { random } from 'lodash';
import { BehaviorSubject, map, type Observable, scan, shareReplay, switchMap } from 'rxjs';
import { currentTable$ } from '../../../../../api/data/currentTable$';
import colorsJson from './colors.json';

export type Color = {
	name: string;
	400: string;
	500: string;
	600: string;
	700: string;
	950: string;
}

const colors: Array<Color> = colorsJson as Array<Color>;

const subject = new BehaviorSubject<void>(undefined);
export const color$: Observable<Color> = currentTable$.pipe(
	switchMap(() => subject.asObservable().pipe(
		scan(acc => {
			const newAcc = acc + 1;
			return newAcc >= colors.length ? 0 : newAcc;
		}, random(colors.length - 1)),
		map(index => colors[index]!),
	)),
	shareReplay({ bufferSize: 1, refCount: true }),
);

color$.subscribe(color => {
	document.querySelector('meta[name=theme-color]')!.setAttribute(
		'content',
		color['500'],
	);

	document.documentElement.style.setProperty(
		'--accent-color-400',
		color['400'],
	);
	document.documentElement.style.setProperty(
		'--accent-color-500',
		color['500'],
	);
	document.documentElement.style.setProperty(
		'--accent-color-600',
		color['600'],
	);
	document.documentElement.style.setProperty(
		'--accent-color-700',
		color['700'],
	);
	document.documentElement.style.setProperty(
		'--accent-color-950',
		color['950'],
	);
});

export function cycleColor(): void {
	subject.next();
}
