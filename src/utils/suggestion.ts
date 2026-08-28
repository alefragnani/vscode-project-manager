/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { commands, l10n, Uri, window, workspace } from "vscode";
import path = require("path");
import { isRunningOnCodespaces } from "./remote";

/**
 * Build a percent-encoded URI string from a remote VS Code Uri.
 *
 * Use this instead of manual `${scheme}://${authority}${path}` template
 * concatenation: that form interpolates the *decoded* `path` and therefore
 * loses any `#` (and other URI-reserved characters) as the URI is reparsed
 * downstream via `Uri.parse`, where `#` becomes the fragment delimiter.
 * See issue #846.
 */
export function buildRemoteProjectPath(uri: Uri): string {
    return uri.toString();
}

/**
 * Build a `vscode-remote://codespaces+NAME/...` URI string from a local
 * folder Uri + the Codespace name. Uses `Uri.from` so the local path is
 * percent-encoded on the way out (mirrors `buildRemoteProjectPath`).
 */
export function buildCodespacesProjectPath(localUri: Uri, codespaceName: string): string {
    return Uri.from({
        scheme: "vscode-remote",
        authority: `codespaces+${codespaceName}`,
        path: localUri.path
    }).toString();
}

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
                path: buildRemoteProjectPath(workspace.workspaceFile),
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
                    path: buildCodespacesProjectPath(workspace.workspaceFolders[ 0 ].uri, info.name),
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
            path: buildRemoteProjectPath(workspace.workspaceFolders[ 0 ].uri),
            name: path.basename(workspace.workspaceFolders[ 0 ].uri.fsPath)
        };
    }

    if (workspace.workspaceFolders[ 0 ].uri.scheme === "vscode-vfs") {
        return {
            path: buildRemoteProjectPath(workspace.workspaceFolders[ 0 ].uri),
            name: path.basename(workspace.workspaceFolders[ 0 ].uri.fsPath)
        };
    }
}
