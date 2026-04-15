import { client } from '@api/client';
import { createAction } from '@api/createAction';
import { fromCurrentTable } from '@api/data/currentTable$';
import { Undo2Icon } from 'lucide-svelte';

const update = createAction<void>(
	() => fromCurrentTable(table =>
		client.undo.mutate({ table }),
	),
	{
		successMessage: () => 'Undone!',
		successIcon: Undo2Icon,
	},
);

export function undo(): void {
	update();
}
