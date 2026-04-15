import { client } from '@api/client';
import { fromSubscription } from '@api/fromSubscription';
import { isNil } from 'lodash';
import { type Observable, of, shareReplay, startWith, switchMap } from 'rxjs';
import { currentTable$ } from './currentTable$';

export const canUndo$: Observable<boolean> = currentTable$.pipe(
	switchMap(table => {
		if (isNil(table)) {
			return of(false);
		}
		return fromSubscription<boolean>(callbacks =>
			client.watchCanUndo.subscribe({ table }, callbacks),
		);
	}),
	startWith(false),
	shareReplay({ bufferSize: 1, refCount: true }),
);

