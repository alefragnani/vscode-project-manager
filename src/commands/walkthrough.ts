/*----------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*---------------------------------------------------------------------------------------------*/

import { commands } from "vscode";
import { Container } from "../core/container";

function openSideBar() {
    commands.executeCommand("projectsExplorerFavorites.focus");
}

export function registerWalkthrough() {
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.openSideBar", () => openSideBar()));
}