/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands, Uri, window } from "vscode";
import { Container } from "../../vscode-project-manager-core/src/container";
import { isRemotePath, isWindows } from "../../vscode-project-manager-core/src/utils/remote";

async function revealFileInOS(node: any) {
    if (!node) { return }

    if (isRemotePath(node.command.arguments[ 0 ])) {
        const revealApp = isWindows ? "Explorer" : "Finder";
        window.showErrorMessage(`Remote projects can't be revealed in ${revealApp}`);
    }

    commands.executeCommand("revealFileInOS", Uri.file(node.command.arguments[ 0 ]))
}
export function registerRevealFileInOS() {
    commands.executeCommand("setContext", "isWindows", isWindows);
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.revealInFinder#sideBar", (node) => revealFileInOS(node)));
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.revealInExplorer#sideBar", (node) => revealFileInOS(node)));
}