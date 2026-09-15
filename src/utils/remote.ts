/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import { env, Uri } from "vscode";

export const REMOTE_PREFIX = "vscode-remote";
export const VIRTUAL_WORKSPACE_PREFIX = "vscode-vfs";
export const OVERLEAF_WORKSHOP_PREFIX = "overleaf-workshop";

export const isWindows = process.platform === "win32";
export const isMacOS = process.platform === "darwin";

export function isRemotePath(projectPath: string): boolean {
    return projectPath.startsWith(REMOTE_PREFIX)
        || projectPath.startsWith(VIRTUAL_WORKSPACE_PREFIX)
        || projectPath.startsWith(OVERLEAF_WORKSHOP_PREFIX);
}

export function isRemoteUri(uri: Uri): boolean {
    return uri.scheme === REMOTE_PREFIX
        || uri.scheme === VIRTUAL_WORKSPACE_PREFIX
        || uri.scheme === OVERLEAF_WORKSHOP_PREFIX;
}

export function isRunningOnCodespaces(): boolean {
    return env.remoteName?.toLocaleLowerCase() === 'codespaces';
}
