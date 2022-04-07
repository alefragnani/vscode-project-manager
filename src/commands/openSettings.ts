/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands } from "vscode";
import { Container } from "../../vscode-project-manager-core/src/container";

function openSettings(kind?: string) {
    commands.executeCommand("workbench.action.openSettings", kind ? `projectManager.${kind}` : "projectManager");
}


export function registerOpenSettings() {
    Container.context.subscriptions.push(commands.registerCommand("projectManager.openSettings#sideBarFavorites", () => openSettings()));
    Container.context.subscriptions.push(commands.registerCommand("projectManager.openSettings#sideBarVSCode", () => openSettings("vscode")));
    Container.context.subscriptions.push(commands.registerCommand("projectManager.openSettings#sideBarSVN", () => openSettings("svn")));
    Container.context.subscriptions.push(commands.registerCommand("projectManager.openSettings#sideBarGit", () => openSettings("git")));
    Container.context.subscriptions.push(commands.registerCommand("projectManager.openSettings#sideBarAny", () => openSettings("any")));
    Container.context.subscriptions.push(commands.registerCommand("projectManager.openSettings#sideBarMercurial", () => openSettings("hg")));
}