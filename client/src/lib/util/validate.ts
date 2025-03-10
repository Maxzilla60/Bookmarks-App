import { type Type, type } from 'arktype';
import { showError } from '../components/error/errors$';

export function validate(schema: Type<unknown, {}>, obj: any, title: string): boolean {
	const result = schema(obj);

	if (result instanceof type.errors) {
		showError('Error validating update! See console.');
		console.error(title, result.summary);
		return false;
	}

	return true;
}
