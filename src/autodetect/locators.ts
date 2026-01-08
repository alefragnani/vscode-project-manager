/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";

import { AutodetectProvider } from "../sidebar/autodetectProvider";
import { Providers } from "../sidebar/providers";
import { PathUtils } from "../utils/path";
import { sortProjects } from "../utils/sorter";
import { CustomProjectLocator } from "./abstractLocator";
import { VSCodeRepositoryDetector } from "./vscodeRepositoryDetector";
import { CustomRepositoryDetector } from "./repositoryDetector";
import { GitRepositoryDetector } from "./gitRepositoryDetector";
import { codicons } from "vscode-ext-codicons";
import { l10n } from "vscode";
import { isRemotePath, isRemoteUri } from "../utils/remote";
import { Uri, workspace } from "vscode";

export const VSCODE_ICON = codicons.file_code;
export const GIT_ICON = codicons.git_branch;
export const MERCURIAL_ICON = codicons.git_branch;
export const SVN_ICON = codicons.zap;
export const ANY_ICON = codicons.file_directory;

export class Locators implements vscode.Disposable {
  
	public vscLocator: CustomProjectLocator = new CustomProjectLocator("vscode", "VSCode", VSCODE_ICON, new VSCodeRepositoryDetector());
	public gitLocator: CustomProjectLocator = new CustomProjectLocator("git", "Git", GIT_ICON, new GitRepositoryDetector([".git"]));
	public mercurialLocator: CustomProjectLocator = new CustomProjectLocator("hg", "Mercurial", MERCURIAL_ICON, new CustomRepositoryDetector([".hg"]));
	public svnLocator: CustomProjectLocator = new CustomProjectLocator("svn", "SVN", SVN_ICON, new CustomRepositoryDetector([".svn", "pristine"]));
	public anyLocator: CustomProjectLocator = new CustomProjectLocator("any", "Any", ANY_ICON, new CustomRepositoryDetector([]));
  
	private providerManager: Providers;

	public registerCommands() {
		vscode.commands.registerCommand("projectManager.refreshVSCodeProjects", () => this.refreshProjectsByType("VSCode", this.vscLocator, this.providerManager.vscodeProvider, true, true));
		vscode.commands.registerCommand("projectManager.refreshGitProjects", () => this.refreshProjectsByType("Git", this.gitLocator, this.providerManager.gitProvider, true, true));
		vscode.commands.registerCommand("projectManager.refreshMercurialProjects", () => this.refreshProjectsByType("Mercurial", this.mercurialLocator, this.providerManager.mercurialProvider, true, true));
		vscode.commands.registerCommand("projectManager.refreshSVNProjects", () => this.refreshProjectsByType("SVN", this.svnLocator, this.providerManager.svnProvider, true, true));
		vscode.commands.registerCommand("projectManager.refreshAnyProjects", () => this.refreshProjectsByType("Any", this.anyLocator, this.providerManager.anyProvider, true, true));
	}

	public dispose() {
		if (vscode.workspace.getConfiguration("projectManager").get("cacheProjectsBetweenSessions", true)) { 
				return; 
		}
    
		this.vscLocator.deleteCacheFile();
		this.gitLocator.deleteCacheFile();
		this.mercurialLocator.deleteCacheFile();
		this.svnLocator.deleteCacheFile();
		this.anyLocator.deleteCacheFile();
	}

	public setProviderManager(providerManager: Providers) {
		this.providerManager = providerManager;
	}

	public getLocatorProjects(itemsSorted: any[], locator: CustomProjectLocator): Promise<any[]> {

		return new Promise((resolve, reject) => {

			locator.locateProjects()
				.then(this.filterKnownDirectories.bind(this, itemsSorted))
				.then((dirList: any[]) => {
					let newItems = [];
					newItems = dirList.map(item => {
						return {
							label: locator.icon + " " + item.name,
							description: item.fullPath
						};
					});

					newItems = this.sortGroupedList(newItems);
					resolve(itemsSorted.concat(newItems));
				});
		});
	}

	public sortGroupedList(items): any[] {
		if (vscode.workspace.getConfiguration("projectManager").get("groupList", false)) {
			return this.sortProjectList(items);
		} else {
			return items;
		}
	}

	public sortProjectList(items): any[] {
		let itemsToShow = PathUtils.expandHomePaths(items);
		itemsToShow = this.removeRootPath(itemsToShow);
		const checkInvalidPath: boolean = vscode.workspace.getConfiguration("projectManager").get("checkInvalidPathsBeforeListing", true);
		if (checkInvalidPath) {
			itemsToShow = PathUtils.indicateInvalidPaths(itemsToShow);
		}
		const newItemsSorted = sortProjects(itemsToShow);
		return newItemsSorted;
	}

	public refreshProjectsByType(projectType: string, locator: CustomProjectLocator, projectProvider: AutodetectProvider, showMessage?: boolean, forceRefresh?: boolean) {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: l10n.t("Refreshing Projects"),
			cancellable: false
		}, async (progress) => {
			progress.report({ increment: 50, message: projectType });
			const result = await locator.refreshProjects(forceRefresh);

			if (result || forceRefresh) {
				progress.report({ increment: 50, message: projectType });
				projectProvider.refresh();
				projectProvider.showTreeView();
			}
		}).then(async () => {
			if (showMessage) {
				await this.delay(1000);
				vscode.window.showInformationMessage(l10n.t("{0} projects have been refreshed!", projectType));
			}
		})
	}

	private removeRootPath(items: any[]): any[] {
		// if (!vscode.workspace.rootPath) {
		const workspace0 = workspace.workspaceFile ? workspace.workspaceFile :
				workspace.workspaceFolders ? workspace.workspaceFolders[0].uri : 
				undefined;

		if (!workspace0 || !vscode.workspace.getConfiguration("projectManager").get("removeCurrentProjectFromList")) {
			return items;
		} else {
				if (isRemoteUri(workspace0)) {
						return items.filter(value => {
								if (!isRemotePath(value.description)) { return value }
    
								const uriElement = Uri.parse(value.description);
								if (uriElement.path !== workspace0.path) {
										return value;
								}
						})
				} else {
						return items.filter(value => value.description.toString().toLowerCase() !== vscode.workspace.rootPath.toLowerCase());
				}
		}
	}

	// Filters out any newDirectories entries that are present in knownDirectories.
	private filterKnownDirectories(knownDirectories: any[], newDirectories: any[]): Promise<any[]> {
		if (knownDirectories) {
			newDirectories = newDirectories.filter(item =>
				!knownDirectories.some(sortedItem =>
					PathUtils.expandHomePath(sortedItem.description).toLowerCase() === PathUtils.expandHomePath(item.fullPath).toLowerCase()));
		}

		return Promise.resolve(newDirectories);
	}

	private async delay(ms: number) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

}
