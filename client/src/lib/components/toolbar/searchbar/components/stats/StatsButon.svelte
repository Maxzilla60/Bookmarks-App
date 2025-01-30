<script lang="ts">
	import { ChartPieIcon, CheckIcon } from 'lucide-svelte';
	import { filter, map } from 'rxjs';
	import { confirmButtonText } from '../../../../../util/util';
	import PopUp from '../../../../shared/popup/PopUp.svelte';
	import { createOpenDialogSubject } from '../../../../shared/popup/popUpDialog';
	import Tag from '../../../../shared/Tag.svelte';
	import { stats$ } from './stats.js';

	const statsDialogId = 'stats_dialog';

	const showStatsDialogSubject = createOpenDialogSubject(statsDialogId);

	const buttonText$ = showStatsDialogSubject.asObservable().pipe(
		filter(open => open === true),
		map(confirmButtonText),
	);
</script>

<button
	onclick={() => showStatsDialogSubject.next(true)}
	title="Statistics"
	aria-label="Statistics"
>
	<ChartPieIcon color="white"/>
</button>
<PopUp
	id={statsDialogId}
	width={20}
	height={80}
>
	<dl>
		<dt>Bookmarks without tags</dt>
		<dd>{$stats$?.noTags}</dd>
		<dt>Bookmarks yet to be in a versus</dt>
		<dd>{$stats$?.noVersus}</dd>
		<dt>Bookmarks marked as
			<Tag tag="deleted"/>
		</dt>
		<dd>{$stats$?.deleted}</dd>
		<dd>
			<table>
				<thead>
				<tr>
					<th>Tag</th>
					<th>Count</th>
				</tr>
				</thead>
				<tbody>
				{#each $stats$?.tagStats as tagStat (tagStat.tag)}
					<tr>
						<td>
							<Tag tag={tagStat.tag}/>
						</td>
						<td>{tagStat.count}</td>
					</tr>
				{/each}
				</tbody>
			</table>
		</dd>
	</dl>
	<button
		onclick={() => showStatsDialogSubject.next(false)}
		autofocus
	>
		<CheckIcon color="white"/>
		<span>{$buttonText$}</span>
	</button>
</PopUp>

<style>
	dl {
		flex: auto;
		text-align: center;
		background-color: white;
		margin: 0;
		padding: 10px;
		overflow-y: scroll;
	}

	dt {
		font-weight: bold;
	}

	dd {
		margin: 0;
		font-size: x-large;
	}

	dd:not(:last-child) {
		padding-bottom: 10px;
	}

	table, thead, tbody, tr {
		display: flex;
	}

	table, thead, tbody {
		flex-direction: column;
	}

	thead, tr {
		justify-content: space-around;
	}

	thead {
		padding-bottom: 10px;
	}

	td, th {
		display: block;
		flex-basis: 50%;
	}

	tr:not(:last-child) {
		padding-bottom: 10px;
	}
</style>
