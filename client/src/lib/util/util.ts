import type { Bookmark, VersusStats } from 'bookmarksapp-schemas/schemas';
import { wilsonScore } from 'decay';
import fuzzysort from 'fuzzysort';
import { sample } from 'lodash';
import { filter, fromEvent, Observable } from 'rxjs';
import { BookmarksSort } from './sort.enum';

export function randomChoice<T>(array: Array<T>): T {
	return sample(array)!;
}

export function sortBy(sort: BookmarksSort): (a: Bookmark, b: Bookmark) => number {
	switch (sort) {
		case BookmarksSort.POSITION:
			return sortByPosition;
		case BookmarksSort.VERSUS_SCORE:
		default:
			return sortByVersus;
	}
}

export function getBookmarkVersusString({ position, versus }: Bookmark): string {
	if (!versus || versus.compared === 0) {
		return `p${position} | v0 | ⭕`;
	}
	const score = (calculateVersusScore(versus) * 1000).toFixed(0);
	return `p${position} | v${score} | ${versus.voted}:${versus.compared}`;
}

export function fromCtrlShortcut(target: Node, keyCode: string): Observable<KeyboardEvent> {
	return fromEvent<KeyboardEvent>(target, 'keydown')
		.pipe(filter((e: KeyboardEvent) => e.ctrlKey && (e.key === keyCode || e.key.toLowerCase() === keyCode)));
}

export function confirmButtonText(): string {
	const okays = [
		'Okidoki',
		'Alright',
		'I see',
		'Got\'cha',
		'Mhm',
		'Okay',
	];
	return randomChoice(okays);
}

export function fuzzySearch(bookmarks: Array<Bookmark>, searchTerm: string): Array<Bookmark> {
	if (searchTerm && searchTerm.length > 0) {
		const searchableBookmarks = bookmarks.map(b => ({
			...b,
			tagsString: b.tags.join(' '),
		}));
		return fuzzysort.go(
			searchTerm,
			searchableBookmarks,
			{ keys: ['tagsString', 'title', 'url'] },
		).map(result => result.obj);
	}
	return bookmarks;
}

function sortByPosition(a: Bookmark, b: Bookmark): number {
	const scoreA = calculateVersusScore(a.versus);
	const scoreB = calculateVersusScore(b.versus);
	return b.position - a.position || scoreB - scoreA;
}

function sortByVersus(a: Bookmark, b: Bookmark): number {
	const scoreA = calculateVersusScore(a.versus);
	const scoreB = calculateVersusScore(b.versus);
	return scoreB - scoreA || b.position - a.position;
}

export function calculateVersusScore(versus?: VersusStats): number {
	if (!versus) {
		return 0;
	}
	return wilsonScore(3.3)(
		versus.voted,
		versus.compared,
	);
}
