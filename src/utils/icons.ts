/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import path = require("path");
import { IconPath, Uri, workspace } from "vscode";
import { codicons } from "vscode-ext-codicons";
import { Container } from "../core/container";
import { isRemoteUri, REMOTE_PREFIX, VIRTUAL_WORKSPACE_PREFIX } from "./remote";

export function currentIconThemeHasFolderIcon(): boolean {
    const currentIconTheme = workspace.getConfiguration("workbench").get<string>("iconTheme", "");

    return currentIconTheme === null || currentIconTheme === "vs-seti";
}

function translateCodiconToLocalIcons(codicon: string): string {
    switch (codicon) {
        case codicons.file_code: return "vscode";
        case codicons.git_branch: return "git";
        case codicons.zap: return "svn";
        case codicons.file_directory: return "folder";
        case codicons.root_folder: return "favorites-workspace";
        default: return codicon;
    }
}

export function getProjectIconPath(icon: string, lightDark: string): string {
    return "images/ico-" + translateCodiconToLocalIcons(icon) + "-" + lightDark + ".svg";
}

export function getProjectIcon(icon: string, projectPath: string): string | IconPath {
    if (projectPath.startsWith(`${REMOTE_PREFIX}://codespaces`)) {
        return {
            light: Uri.joinPath(Container.context.extensionUri, getProjectIconPath("favorites-remote-codespaces", "light")),
            dark: Uri.joinPath(Container.context.extensionUri, getProjectIconPath("favorites-remote-codespaces", "dark"))
        };
    }

    return {
        light: Uri.joinPath(Container.context.extensionUri, getProjectIconPath(icon, "light")),
        dark: Uri.joinPath(Container.context.extensionUri, getProjectIconPath(icon, "dark"))
    };
}

export function getCodiconFromUri(uri: Uri): string {
    if (!isRemoteUri(uri)) {
        return codicons.file_directory;
    }

    return uri.scheme === REMOTE_PREFIX
        ? codicons.remote_explorer
        : codicons.remote;
}

export interface TooltipIconInfo {
    icon: string,
    title: string
}

export function getIconDetailsFromProjectPath(projectPath: string): TooltipIconInfo {
    if (projectPath.startsWith(`${REMOTE_PREFIX}://codespaces`)) {
        return {
            icon: codicons.github,
            title: "Codespaces"
        };
    }
    if (projectPath.startsWith(`${REMOTE_PREFIX}://dev-container`)) {
        return {
            icon: codicons.symbol_method,
            title: "Container"
        };
    }
    if (projectPath.startsWith(`${REMOTE_PREFIX}://ssh`)) {
        return {
            icon: codicons.terminal,
            title: "SSH"
        };
    }
    if (projectPath.startsWith(`${REMOTE_PREFIX}://wsl`)) {
        return {
            icon: codicons.terminal_linux,
            title: "WSL"
        };
    }
    if (projectPath.startsWith(`${VIRTUAL_WORKSPACE_PREFIX}://`)) {
        return {
            icon: codicons.remote,
            title: "Virtual Workspace"
        };
    }
    if (path.extname(projectPath) === ".code-workspace") {
        return {
            icon: codicons.root_folder,
            title: "Workspace"
        };
    }
    return {
        icon: codicons.folder,
        title: "Folder"
    };
}
