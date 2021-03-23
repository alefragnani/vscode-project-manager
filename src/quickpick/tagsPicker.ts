/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { QuickPickItem, window } from "vscode";
import { NO_TAGS_DEFINED } from "../../vscode-project-manager-core/src/sidebar/constants";
import { Storage } from "../../vscode-project-manager-core/src/storage";

export async function pickTags(storage: Storage, preselected: string[]): Promise<string[] | undefined> {

    const tags = storage.getAvailableTags();
    if (tags.length === 0) {
        return undefined;
    }

    tags.push(NO_TAGS_DEFINED);

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