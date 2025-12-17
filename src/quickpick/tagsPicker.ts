/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { l10n, QuickPickItem, window, workspace } from "vscode";
import { NO_TAGS_DEFINED } from "../sidebar/constants";
import { ProjectStorage } from "../storage/storage";

export interface PickTagOptions {
	useDefaultTags: boolean,
	useNoTagsDefined: boolean,
	showWarningWhenHasNoTagsToPick?: boolean
}

export async function pickTags(storage: ProjectStorage, preselected: string[], options?: PickTagOptions): Promise<string[] | undefined> {

	const defaultTags = workspace.getConfiguration("projectManager").get<string[]>("tags");
	let tags = storage.getAvailableTags();

	tags.push(...preselected.filter(tag => !tags.includes(tag) && tag !== NO_TAGS_DEFINED));

	if (options?.useDefaultTags) {
		defaultTags.forEach(tag => {
			if (!tags.includes(tag)) {
				tags.push(tag);
			}
		});
	}

	if (tags.length === 0) {
		if (options?.showWarningWhenHasNoTagsToPick) {
			window.showWarningMessage(l10n.t("No tags available/defined."));
		}
		return undefined;
	}

	tags = tags.sort();
	if (options?.useNoTagsDefined) {
		tags.push(NO_TAGS_DEFINED);
	}

	const items: QuickPickItem[] = tags.map(tag => {
		return {
			label: tag,
			picked: preselected.includes(tag)
		}
	});

	const selection = await window.showQuickPick(items, {
		placeHolder: l10n.t('Select the tags'),
		canPickMany: true
	});

	if (typeof selection === "undefined") {
		return undefined
	}

	const selections = selection.map(item => item.label)
	return selections;
}
