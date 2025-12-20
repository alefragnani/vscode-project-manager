/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import vscode = require("vscode");
import walker = require("walker");
import { PathUtils } from "../utils/path";
import { Project } from "../core/project";
import minimatch = require("minimatch");
import { l10n } from "vscode";

const CACHE_FILE = "projects_cache_";

export interface DirInfo {
	fullPath: string;
	name: string;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface DirList extends Array<DirInfo> { }

export interface RepositoryDetector {

	isRepoDir(projectPath: string);
	decideProjectName(projectPath: string): string; 

}

export class CustomRepositoryDetector implements RepositoryDetector {

	constructor(public paths: string[]) {
	}

	public isRepoDir(projectPath: string) {
		return fs.existsSync(path.join(projectPath, ...this.paths));
	}

	public decideProjectName(projectPath: string): string {
		return path.basename(projectPath);
	}    
}

export class CustomProjectLocator {

	public dirList: DirList = <DirList> [];
	private maxDepth: number;
	private ignoredFolders: string[];
	private useCachedProjects: boolean;
	private ignoreProjectsWithinProjects: boolean;
	private alreadyLocated: boolean;
	private baseFolders: string[];

	constructor(public kind: string, public displayName: string,
				public icon: string, public repositoryDetector: RepositoryDetector) {
		this.maxDepth = -1;
		this.ignoredFolders = [];
		this.useCachedProjects = true;
		this.ignoreProjectsWithinProjects = false;
		this.alreadyLocated = false;
		this.baseFolders = [];
		this.refreshConfig();
		this.initializeCfg();
	}

	public getPathDepth(s: string) {
		let depth = s.split(path.sep).length;
		if (s.endsWith(path.sep))
			depth--;
		return depth;
	}

	public isMaxDepthReached(currentDepth, initialDepth) {
		return (this.maxDepth > 0) && ((currentDepth - initialDepth) > this.maxDepth);
	}

	public isFolderIgnored(folder) {
		const matches = this.ignoredFolders.filter(f => minimatch(folder, f))
		return matches.length > 0;
	}

	private isProjectWithinProjectIgnored(folder: string) {
		if (!this.ignoreProjectsWithinProjects) { 
			return false 
		}

		let found = false;
		this.dirList.forEach(dir => {
			found = found || folder.startsWith(dir.fullPath);
		});
		return found;
	}

	public isAlreadyLocated(): boolean {
		return this.alreadyLocated;
	}

	public updateCacheFile(): void {
		this.alreadyLocated = true;
		const cacheFile: string = this.getCacheFile();
		fs.writeFileSync(cacheFile, JSON.stringify(this.dirList, null, "\t"), { encoding: "utf8" });
	}

	public clearDirList() {
		this.dirList = [];
	}

	private initializeCfg() {

		const cacheFile: string = this.getCacheFile();
        
		if (fs.existsSync(cacheFile)) {
			try {
				this.dirList = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
				this.alreadyLocated = true;
			} catch (error) {
				this.deleteCacheFile();
				console.log(`Error while loading cache file for ${this.kind}. Cache file replaced.`);
			}
			return;
		}
	}

	public locateProjects() {

		let projectsDirList = this.baseFolders;
		projectsDirList = PathUtils.updateWithPathSeparator(projectsDirList);
		projectsDirList = PathUtils.handleSymlinks(projectsDirList);
		this.baseFolders = projectsDirList.slice();

		return new Promise<DirList>((resolve, reject) => {

			if (projectsDirList.length === 0) {
				resolve(<DirList> []);
				return;
			}

			if (this.alreadyLocated) {
				resolve(this.dirList);
				return;
			}

			const promises = [];
			this.clearDirList();

			projectsDirList.forEach((projectBasePath) => {
				const expandedBasePath: string = PathUtils.expandHomePath(projectBasePath);
				if (!fs.existsSync(expandedBasePath)) {
					// vscode.window.setStatusBarMessage("Directory " + expandedBasePath + " does not exists.", 1500);

					return;
				}

				const depth = this.getPathDepth(expandedBasePath);

				const promise = new Promise<void>((resolve, reject) => {
					try {
						walker(expandedBasePath)
							.filterDir((dir, stat) => {
								return !(this.isFolderIgnored(path.basename(dir)) ||
									this.isMaxDepthReached(this.getPathDepth(dir), depth) || 
									this.isProjectWithinProjectIgnored(dir))
							})
							.on("dir", this.processDirectory)
							.on("error", this.handleError)
							.on("end", () => {
								resolve();
							});
					} catch (error) {
						reject(error);
					}

				});
				promises.push(promise);
			});

			Promise.all(promises)
				.then(() => {
					// vscode.window.setStatusBarMessage("Searching folders completed", 1500);
					this.updateCacheFile();
					resolve(this.dirList);
				})
				.catch(error => { vscode.window.showErrorMessage(l10n.t("Error while loading projects.")); });
		});
	}

	public addToList(projectPath: string, projectName: string = null) {
		this.dirList.push({
			fullPath: projectPath,
			name: projectName === null ? path.basename(projectPath) : projectName
		});
		return;
	}

	public processDirectory = (absPath: string, stat: any) => {
		// vscode.window.setStatusBarMessage(absPath, 600);
		if (this.repositoryDetector.isRepoDir(absPath)) {
			this.addToList(absPath, this.repositoryDetector.decideProjectName(absPath));
		}
	}

	public handleError(err) {
		console.log("Error walker:", err);
	}

	public refreshProjects(forceRefresh: boolean): Promise<boolean> {

		return new Promise((resolve, reject) => {
            
			if (!forceRefresh && !this.refreshConfig()) {
				resolve(false);
				return;
			}
    
			this.clearDirList();
			const cacheFile: string = this.getCacheFile();
			if (fs.existsSync(cacheFile)) {
				fs.unlinkSync(cacheFile);
			}
			this.alreadyLocated = false;
			this.locateProjects()
                .then(() => {
                    resolve(true);
				})
				.catch(error => {
					reject(error)
				})            
		});
	}

	public existsWithRootPath(rootPath: string): Project {
        
		// it only works if using `cache`
		if (!this.alreadyLocated) {
			return null;
		}

		for (const element of this.dirList) {
			if ((element.fullPath.toLocaleLowerCase() === rootPath.toLocaleLowerCase())) {
				return {
					rootPath: element.fullPath,
					name: element.name,
					tags: [],
					paths: [],
					enabled: true,
					profile: ""
				};
			}
		}
	}

	private getCacheFile() {
		return PathUtils.getFilePathFromAppData(CACHE_FILE + this.kind + ".json");
	}

	private refreshConfig(): boolean {
		const config = vscode.workspace.getConfiguration("projectManager");
		let refreshedSomething = false;
		let currentValue = null;

		currentValue = config.get<string[]>(this.kind + ".baseFolders");
		if (!this.arraysAreEquals(this.baseFolders, currentValue)) {
			this.baseFolders = currentValue;
			refreshedSomething = true;
		}

		currentValue = config.get<string[]>(this.kind + ".ignoredFolders", []);
		if (!this.arraysAreEquals(this.ignoredFolders, currentValue)) {
			this.ignoredFolders = currentValue;
			refreshedSomething = true;
		}        

		currentValue = config.get(this.kind + ".maxDepthRecursion", -1);
		if (this.maxDepth !== currentValue) {
			this.maxDepth = currentValue;
			refreshedSomething = true;
		}

		currentValue = config.get("cacheProjectsBetweenSessions", true);
		if (this.useCachedProjects !== currentValue) {
			this.useCachedProjects = currentValue;
			refreshedSomething = true;
		}

		currentValue = config.get("ignoreProjectsWithinProjects", false);
		if (this.ignoreProjectsWithinProjects !== currentValue) {
			this.ignoreProjectsWithinProjects = currentValue;
			refreshedSomething = true;
		}

		return refreshedSomething;
	}

	private arraysAreEquals(array1, array2): boolean {
		if (!array1 || !array2) {
			return false;
		}

		if (array1.length !== array2.length) {
			return false;
		}

		for (let i = 0, l = array1.length; i < l; i++) {
			if (array1[i] instanceof Array && array2[i] instanceof Array) {
				if (!array1[i].equals(array2[i])) {
					return false;
				}
			} else {
				if (array1[i] !== array2[i]) {
					return false;
				}
			}
		}
		return true;
	}

	public deleteCacheFile() {
		const cacheFile: string = this.getCacheFile();
		if (fs.existsSync(cacheFile)) {
			fs.unlinkSync(cacheFile);
		}
	}
}
