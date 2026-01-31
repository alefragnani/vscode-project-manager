/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { StatusBarAlignment, StatusBarItem, window, workspace } from "vscode";
import { Locators } from "../autodetect/locators";
import { ProjectStorage } from "../storage/storage";
import { codicons } from "vscode-ext-codicons";
import { isRemoteUri } from "../utils/remote";
import { getCodiconFromUri } from "../utils/icons";
import { Project } from "../core/project";

let statusItem: StatusBarItem;

export function showStatusBar(projectStorage: ProjectStorage, locators: Locators, projectName?: string): Project {

    const showStatusConfig = workspace.getConfiguration("projectManager").get("showProjectNameInStatusBar");

    // multi-root - decide do use the "first folder" as the original "rootPath"
    // let currentProjectPath = vscode.workspace.rootPath;
    //   const workspace0 = workspace.workspaceFolders ? workspace.workspaceFolders[0] : undefined;
    //   const currentProjectPath = workspace0 ? workspace0.uri.fsPath : undefined;
    const workspace0 = workspace.workspaceFile ? workspace.workspaceFile :
        workspace.workspaceFolders ? workspace.workspaceFolders[ 0 ].uri :
            undefined;
    const currentProjectPath = workspace0 ? workspace0.fsPath : undefined;

    if (!showStatusConfig || !currentProjectPath) { return; }

    if (!statusItem) {
        statusItem = window.createStatusBarItem("projectManager.statusBar", StatusBarAlignment.Left);
        statusItem.name = "Project Manager";
    }
    statusItem.text = getCodiconFromUri(workspace0) + " ";
    statusItem.tooltip = currentProjectPath;

    const openInNewWindow: boolean = workspace.getConfiguration("projectManager").get("openInNewWindowWhenClickingInStatusBar", false);
    if (openInNewWindow) {
        statusItem.command = "projectManager.listProjectsNewWindow";
    } else {
        statusItem.command = "projectManager.listProjects";
    }

    // if we have a projectName, we don't need to search.
    if (projectName) {
        statusItem.text += projectName;
        statusItem.show();
        return undefined;
    }

    let foundProject: Project;
    if (isRemoteUri(workspace0)) {
        foundProject = projectStorage.existsRemoteWithRootPath(workspace0);
    } else {
        foundProject = projectStorage.existsWithRootPath(currentProjectPath, true);
        if (!foundProject) {
            foundProject = locators.vscLocator.existsWithRootPath(currentProjectPath);
        }
        if (!foundProject) {
            foundProject = locators.gitLocator.existsWithRootPath(currentProjectPath);
        }
        if (!foundProject) {
            foundProject = locators.mercurialLocator.existsWithRootPath(currentProjectPath);
        }
        if (!foundProject) {
            foundProject = locators.svnLocator.existsWithRootPath(currentProjectPath);
        }
        if (!foundProject) {
            foundProject = locators.anyLocator.existsWithRootPath(currentProjectPath);
        }
    }
    if (foundProject) {
        statusItem.text += foundProject.name;
        statusItem.show();
        return foundProject;
    }
}

export function updateStatusBar(oldName: string, oldPath: string, newName: string): void {
    if (statusItem.text === codicons.file_directory + " " + oldName && statusItem.tooltip === oldPath) {
        statusItem.text = codicons.file_directory + " " + newName;
    }
}