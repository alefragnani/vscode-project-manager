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

    const config = workspace.getConfiguration("projectManager");
    const defaultTags = config.get<string[]>("tags") ?? [];
    let currentPreselected = preselected ?? [];

    while (true) {
        let tags = storage.getAvailableTags();

        tags.push(...currentPreselected.filter(tag => !tags.includes(tag) && tag !== NO_TAGS_DEFINED));

        if (options?.useDefaultTags) {
            defaultTags.forEach(tag => {
                if (!tags.includes(tag)) {
                    tags.push(tag);
                }
            });
        }

        if (tags.length === 0 && options?.showWarningWhenHasNoTagsToPick) {
            window.showWarningMessage(l10n.t("No tags available/defined."));
        }

        tags = tags.sort();
        if (options?.useNoTagsDefined) {
            tags.push(NO_TAGS_DEFINED);
        }

        const items: QuickPickItem[] = tags.map(tag => {
            return {
                label: tag,
                picked: currentPreselected.includes(tag)
            };
        });

        const addNewItem: QuickPickItem = {
            label: l10n.t("Add new tags..."),
            description: l10n.t("Create and add new tags"),
            alwaysShow: true
        };

        const selection = await window.showQuickPick([ ...items, addNewItem ], {
            placeHolder: l10n.t('Select the tags'),
            canPickMany: true
        });

        if (typeof selection === "undefined") {
            return undefined;
        }

        const addNewSelected = selection.some(item => item.label === addNewItem.label && item.description === addNewItem.description);
        const pickedLabels = selection
            .filter(item => item.label !== addNewItem.label || item.description !== addNewItem.description)
            .map(item => item.label);

        if (!addNewSelected) {
            return pickedLabels;
        }

        const input = await window.showInputBox({
            placeHolder: l10n.t("Type new tags, separated by comma"),
            prompt: l10n.t("New tags"),
            ignoreFocusOut: true
        });

        if (typeof input === "undefined") {
            currentPreselected = pickedLabels;
            continue;
        }

        const newTagsFromInput = input.split(",")
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0 && tag !== NO_TAGS_DEFINED);

        if (newTagsFromInput.length === 0) {
            currentPreselected = pickedLabels;
            continue;
        }

        const existingConfigTags = config.get<string[]>("tags") ?? [];
        const mergedConfigTags = [ ...new Set([ ...existingConfigTags, ...newTagsFromInput ]) ];
        await config.update("tags", mergedConfigTags, true);

        currentPreselected = [ ...new Set([ ...pickedLabels, ...newTagsFromInput ]) ];
    }
}
