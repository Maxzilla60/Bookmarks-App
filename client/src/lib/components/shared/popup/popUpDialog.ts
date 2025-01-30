import { BehaviorSubject } from 'rxjs';

export function createOpenDialogSubject(dialogId: string): BehaviorSubject<boolean> {
	const showDialogSubject = new BehaviorSubject<boolean>(false);
	showDialogSubject.asObservable().subscribe(open => {
		const dialogElement = document.getElementById(dialogId) as HTMLDialogElement | null;
		if (open) {
			dialogElement?.showModal();
		} else {
			dialogElement?.close();
		}
	});
	return showDialogSubject;
}
