/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands, l10n, Uri, window } from "vscode";
import { Container } from "../core/container";
import { isMacOS, isRemotePath, isWindows } from "../utils/remote";
import { ProjectNode } from "../sidebar/nodes";

async function revealFileInOS(node: ProjectNode) {
    if (!node) { return; }

    if (isRemotePath(node.command.arguments[ 0 ])) {
        const revealApp = isWindows ? "Explorer" : isMacOS ? "Finder" : "File Manager";
        window.showErrorMessage(l10n.t("Remote projects can't be revealed in {0}", revealApp));
    }

    commands.executeCommand("revealFileInOS", Uri.file(node.command.arguments[ 0 ]));
}
export function registerRevealFileInOS() {
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.revealInFinder#sideBar", (node) => revealFileInOS(node)));
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.revealInExplorer#sideBar", (node) => revealFileInOS(node)));
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.revealInFileManager#sideBar", (node) => revealFileInOS(node)));
}