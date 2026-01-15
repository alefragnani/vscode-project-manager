/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { l10n, QuickInputButton, QuickPickItem, ThemeIcon, window, workspace } from "vscode";
import { NO_TAGS_DEFINED } from "../sidebar/constants";
import { ProjectStorage } from "../storage/storage";

export interface PickTagOptions {
    useDefaultTags: boolean,
    useNoTagsDefined: boolean,
    showWarningWhenHasNoTagsToPick?: boolean,
    allowAddingNewTags?: boolean
}

export async function pickTags(storage: ProjectStorage, preselected: string[], options?: PickTagOptions): Promise<string[] | undefined> {

    const config = workspace.getConfiguration("projectManager");
    const defaultTags = config.get<string[]>("tags") ?? [];
    let currentPreselected = preselected ?? [];

    const quickPick = window.createQuickPick<QuickPickItem>();
    quickPick.canSelectMany = true;
    quickPick.placeholder = l10n.t("Select the tags");

    const addTagsButton: QuickInputButton = {
        iconPath: new ThemeIcon("add"),
        tooltip: l10n.t("Add new tags")
    };

    quickPick.buttons = options?.allowAddingNewTags ? [ addTagsButton ] : [];

    const refreshItems = () => {
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
                label: tag
            };
        });

        quickPick.items = items;
        quickPick.selectedItems = quickPick.items.filter(item => currentPreselected.includes(item.label));
    };

    refreshItems();

    const result = await new Promise<string[] | undefined>((resolve) => {

        let resolved = false;
        let ignoreHide = false;

        const doResolve = (value: string[] | undefined) => {
            if (resolved) {
                return;
            }
            resolved = true;
            resolve(value);
        };

        quickPick.onDidAccept(() => {
            const selections = quickPick.selectedItems.map(item => item.label);
            ignoreHide = true;
            quickPick.hide();
            quickPick.dispose();
            doResolve(selections);
        });

        quickPick.onDidHide(() => {
            if (ignoreHide) {
                return;
            }
            quickPick.dispose();
            doResolve(undefined);
        });

        quickPick.onDidTriggerButton(async (button) => {
            if (button !== addTagsButton) {
                return;
            }

            ignoreHide = true;

            const input = await window.showInputBox({
                placeHolder: l10n.t("Type new tags, separated by comma"),
                prompt: l10n.t("New tags"),
                ignoreFocusOut: true
            });

            ignoreHide = false;

            if (typeof input === "undefined") {
                quickPick.show();
                return;
            }

            const newTagsFromInput = input.split(",")
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0 && tag !== NO_TAGS_DEFINED);

            if (newTagsFromInput.length === 0) {
                quickPick.show();
                return;
            }

            const existingConfigTags = config.get<string[]>("tags") ?? [];
            const mergedConfigTags = [ ...new Set([ ...existingConfigTags, ...newTagsFromInput ]) ];
            await config.update("tags", mergedConfigTags, true);

            const currentlySelectedLabels = quickPick.selectedItems.map(item => item.label);
            currentPreselected = [ ...new Set([ ...currentlySelectedLabels, ...newTagsFromInput ]) ];

            refreshItems();
            quickPick.show();
        });

        quickPick.show();
    });

    return result;
}
