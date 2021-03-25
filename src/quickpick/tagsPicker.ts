/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { QuickPickItem, window } from "vscode";
import { NO_TAGS_DEFINED } from "../../vscode-project-manager-core/src/sidebar/constants";
import { Storage } from "../../vscode-project-manager-core/src/storage";

export const DEFAULT_TAGS = ['Personal', 'Work'];

export interface PickTagOptions {
    useDefaultTags: boolean,
    useNoTagsDefined: boolean
}

export async function pickTags(storage: Storage, preselected: string[], options?: PickTagOptions): Promise<string[] | undefined> {

    const tags = storage.getAvailableTags();

    if (options?.useDefaultTags) {
        DEFAULT_TAGS.forEach(tag => {
            if (!tags.includes(tag)) {
                tags.push(tag);
            }
        });
    }

    if (tags.length === 0) {
        return undefined;
    }

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
        placeHolder: 'Select the tags',
        canPickMany: true
    });

    if (typeof selection === "undefined") {
        return undefined
    }

    const selections = selection.map(item => item.label)
    return selections;
}