/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import path = require("path");
import { ThemeIcon, Uri, workspace } from "vscode";
import { codicons } from "vscode-ext-codicons";
import { Container } from "./container";
import { isRemoteUri, REMOTE_PREFIX, VIRTUAL_WORKSPACE_PREFIX } from "./utils/remote";

export function currentIconThemeHasFolderIcon(): boolean {
	const currentIconTheme = workspace.getConfiguration("workbench").get<string>("iconTheme", "");
    
	return currentIconTheme === null || currentIconTheme === "vs-seti";
}

export function getProjectIconPath(icon: string, lightDark: string): string {
	return "images/ico-" + icon.toLowerCase() + "-" + lightDark + ".svg";
}

export function getProjectIcon(icon: string, projectPath: string): { light: string; dark: string } | ThemeIcon {
	if (projectPath.startsWith(`${REMOTE_PREFIX}://codespaces`)) {
		return {
			light: Container.context.asAbsolutePath(getProjectIconPath("favorites-remote-codespaces", "light")),
			dark: Container.context.asAbsolutePath(getProjectIconPath("favorites-remote-codespaces", "dark"))
		  }
	}
    
	return {
		light: Container.context.asAbsolutePath(getProjectIconPath(icon, "light")),
		dark: Container.context.asAbsolutePath(getProjectIconPath(icon, "dark"))
	  }
}

export function getCodiconFromUri(uri: Uri): string {
	if (!isRemoteUri(uri)) {
		return codicons.file_directory
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
