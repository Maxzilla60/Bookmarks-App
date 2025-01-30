import fs from 'fs';

export function backupTables(): void {
	fs.cp(
		'database/tables',
		`database/backups/${dateName()}`,
		{ recursive: true },
		(err) => {
			if (err) {
				throw err;
			}
		},
	);
}

function dateName(): string {
	return new Date()
		.toLocaleString('en-GB')
		.replace(/[\/:]/g, '-')
		.replace(/, /g, '_');
}
