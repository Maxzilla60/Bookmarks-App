import type { Category } from 'bookmarksapp-schemas/schemas';
import { chain, isEqual, isNil } from 'lodash';
import randomColor from 'randomcolor';
import { combineLatest, distinctUntilChanged, map, type Observable, switchMap, withLatestFrom } from 'rxjs';
import { allTags$ } from '../../api/data/allBookmarks$';
import { categories$ } from '../../api/data/categories$';
import { currentTable$ } from '../../api/data/currentTable$';
import { type Color, color$ } from '../toolbar/searchbar/components/color/color';

export const tagColors$: Observable<Record<string, string>> = currentTable$.pipe(
	switchMap(createColorObject$),
	distinctUntilChanged(isEqual),
);

function createColorObject$() {
	return combineLatest([color$, allTags$]).pipe(
		withLatestFrom(categories$),
		map(([[globalColor, tags], categories]) =>
			createColorObject(tags, categories, globalColor),
		),
	);
}

function createColorObject(tags: Array<string>, categories: Array<Category>, globalColor: Color): Record<string, string> {
	return chain(tags)
		.concat(categories.flatMap(c => c.tags))
		.uniq()
		.map(tag => [
			tag,
			getColorForTag(tag, globalColor, categories),
		])
		.fromPairs()
		.value();
}

function getColorForTag(tag: string, globalColor: Color, categories: Array<Category>): string {
	const specialColorForTag = categories
		.filter(({ color }) => !isNil(color))
		.find(({ tags }) => tags.includes(tag))
		?.color;

	if (!isNil(specialColorForTag)) {
		return specialColorForTag;
	}

	return randomColor({
		seed: tag,
		luminosity: 'bright',
		hue: globalColor['600'],
	});
}
