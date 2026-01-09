/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands, l10n, window, workspace } from "vscode";
import path = require("path");
import { isRunningOnCodespaces } from "./remote";

export interface ProjectDetails {
    path: string;
    name: string;
}

export async function getProjectDetails(): Promise<ProjectDetails> {

    // workspaceFile - .code-workspace
    if (workspace.workspaceFile) {
        if (workspace.workspaceFile.scheme === "untitled") {
            window.showInformationMessage(l10n.t("Save the workspace first to save a project"));
            return null;
        }

        if (workspace.workspaceFile.scheme === "file") {
            return {
                path: workspace.workspaceFile.fsPath,
                name: path.basename(workspace.workspaceFile.fsPath, ".code-workspace")
            };
        }

        if (workspace.workspaceFile.scheme === "vscode-remote") {
            return {
                path: `${workspace.workspaceFile.scheme}://${workspace.workspaceFile.authority}${workspace.workspaceFile.path}`,
                name: path.basename(workspace.workspaceFile.fsPath, ".code-workspace")
            };
        }
    }

    if (!workspace.workspaceFolders) {
        window.showInformationMessage(l10n.t("Open a folder first to save a project"));
        return null;
    }

    if (workspace.workspaceFolders[ 0 ].uri.scheme === "file") {

        if (isRunningOnCodespaces()) {
            const info = await commands.executeCommand<{ name: string } | undefined>('github.codespaces.getCurrentCodespace');
            if (info) {
                return {
                    path: `vscode-remote://codespaces+${info.name}${workspace.workspaceFolders[ 0 ].uri.fsPath}`,
                    name: path.basename(workspace.workspaceFolders[ 0 ].uri.fsPath)
                };
            }
        }

        return {
            path: workspace.workspaceFolders[ 0 ].uri.fsPath,
            name: path.basename(workspace.workspaceFolders[ 0 ].uri.fsPath)
        };
    }

    if (workspace.workspaceFolders[ 0 ].uri.scheme === "vscode-remote") {
        return {
            path: `${workspace.workspaceFolders[ 0 ].uri.scheme}://${workspace.workspaceFolders[ 0 ].uri.authority}${workspace.workspaceFolders[ 0 ].uri.path}`,
            name: path.basename(workspace.workspaceFolders[ 0 ].uri.fsPath)
        };
    }

    if (workspace.workspaceFolders[ 0 ].uri.scheme === "vscode-vfs") {
        return {
            path: `${workspace.workspaceFolders[ 0 ].uri.scheme}://${workspace.workspaceFolders[ 0 ].uri.authority}${workspace.workspaceFolders[ 0 ].uri.path}`,
            name: path.basename(workspace.workspaceFolders[ 0 ].uri.fsPath)
        };
    }
}
