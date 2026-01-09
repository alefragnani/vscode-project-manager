/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands, ConfigurationTarget, workspace } from "vscode";
import { Container } from "../core/container";

function toggleSortBy(sortBy: string) {
    commands.executeCommand("setContext", "projectManager.sortBy", sortBy);
    workspace.getConfiguration("projectManager").update("sortList", sortBy, ConfigurationTarget.Global);
}

export function registerSortBy() {
    updateSortByContext();
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.sortBySaved#sideBarFavorites", () => toggleSortBy("Saved")));
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.sortByName#sideBarFavorites", () => toggleSortBy("Name")));
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.sortByPath#sideBarFavorites", () => toggleSortBy("Path")));
    Container.context.subscriptions.push(commands.registerCommand("_projectManager.sortByRecent#sideBarFavorites", () => toggleSortBy("Recent")));
}

export function updateSortByContext() {
    const sortBy = workspace.getConfiguration("projectManager").get<string>("sortList", "Name");
    commands.executeCommand("setContext", "projectManager.sortBy", sortBy);
}
