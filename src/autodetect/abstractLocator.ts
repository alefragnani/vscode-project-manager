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
import { minimatch } from "minimatch";
import { l10n, workspace } from "vscode";
import { RepositoryDetector } from "./repositoryDetector";
import { AutodetectedProjectInfo } from "./autodetectedProjectInfo";

const CACHE_FILE = "projects_cache_";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface AutodetectedProjectList extends Array<AutodetectedProjectInfo> { }

export class CustomProjectLocator {

    public projectList: AutodetectedProjectList = <AutodetectedProjectList> [];
    private maxDepth: number;
    private ignoredFolders: string[];
    private useCachedProjects: boolean;
    private ignoreProjectsWithinProjects: boolean;
    private alreadyLocated: boolean;
    private baseFolders: string[];
    private excludeBaseFoldersFromResults: boolean;
    private supportedFileExtensions: string[] | null;

    constructor(public kind: string, public displayName: string, public repositoryDetector: RepositoryDetector) {
        this.maxDepth = -1;
        this.ignoredFolders = [];
        this.useCachedProjects = true;
        this.ignoreProjectsWithinProjects = false;
        this.alreadyLocated = false;
        this.baseFolders = [];
        this.excludeBaseFoldersFromResults = false;
        // Cache supported file extensions for performance
        // Normalize extensions to lowercase for consistent comparison
        const extensions = this.repositoryDetector.getSupportedFileExtensions?.();
        this.supportedFileExtensions = extensions ? extensions.map(ext => ext.toLowerCase()) : null;
        this.refreshConfig();
        this.initializeCfg();
    }

    private getPathDepth(s: string) {
        let depth = s.split(path.sep).length;
        if (s.endsWith(path.sep))
            depth--;
        return depth;
    }

    private isMaxDepthReached(currentDepth, initialDepth) {
        return (this.maxDepth > 0) && ((currentDepth - initialDepth) > this.maxDepth);
    }

    private isFolderIgnored(folder) {
        const matches = this.ignoredFolders.filter(f => minimatch(folder, f));
        return matches.length > 0;
    }

    private isProjectWithinProjectIgnored(folder: string) {
        if (!this.ignoreProjectsWithinProjects) { 
            return false; 
        }

        let found = false;
        this.projectList.forEach(dir => {
            found = found || folder.startsWith(dir.fullPath);
        });
        return found;
    }

    public isAlreadyLocated(): boolean {
        return this.alreadyLocated;
    }

    private updateCacheFile(): void {
        this.alreadyLocated = true;
        const cacheFile: string = this.getCacheFile();
        fs.writeFileSync(cacheFile, JSON.stringify(this.projectList, null, "\t"), { encoding: "utf8" });
    }

    private clearProjectList() {
        this.projectList = [];
    }

    private cachedFileIsValid(projectList: AutodetectedProjectList): boolean {
        if (projectList.length > 0 && !("icon" in projectList[0])) {
            return false;
        }

        return true;
    }

    private initializeCfg() {

        const cacheFile: string = this.getCacheFile();
        
        if (fs.existsSync(cacheFile)) {
            try {
                this.projectList = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
                if (!this.cachedFileIsValid(this.projectList)) {
                    this.deleteCacheFile();
                    return;
                }
                this.alreadyLocated = true;
            } catch (error) {
                this.deleteCacheFile();
                console.log(`Error while loading cache file for ${this.kind}. Cache file replaced.`);
            }
            return;
        }
    }

    public async locateProjects(): Promise<AutodetectedProjectList> {

        let projectsDirList = this.baseFolders;
        projectsDirList = await PathUtils.expandWithGlobPatterns(projectsDirList);
        projectsDirList = PathUtils.updateWithPathSeparator(projectsDirList);
        projectsDirList = PathUtils.handleSymlinks(projectsDirList);
        this.baseFolders = projectsDirList.slice();

        return new Promise<AutodetectedProjectList>((resolve) => {

            if (projectsDirList.length === 0) {
                resolve(<AutodetectedProjectList> []);
                return;
            }

            if (this.alreadyLocated) {
                resolve(this.projectList);
                return;
            }

            const promises = [];
            this.clearProjectList();

            projectsDirList.forEach((projectBasePath) => {
                const expandedBasePath: string = PathUtils.expandHomePath(projectBasePath);
                if (!fs.existsSync(expandedBasePath)) {

                    return;
                }

                const depth = this.getPathDepth(expandedBasePath);

                const promise = new Promise<void>((resolve, reject) => {
                    try {
                        walker(expandedBasePath)
                            .filterDir((dir) => {
                                return !(this.isFolderIgnored(path.basename(dir)) ||
                                    this.isMaxDepthReached(this.getPathDepth(dir), depth) || 
                                    this.isProjectWithinProjectIgnored(dir));
                            })
                            .on("dir", this.processDirectory)
                            .on("file", this.processFile)
                            .on("symlink", (link) => {
                                if (!workspace.getConfiguration("projectManager").get<boolean>("supportSymlinksOnBaseFolders", false)) {
                                    return;
                                }
                                if (this.isFolderIgnored(path.basename(link)) ||
                                    this.isMaxDepthReached(this.getPathDepth(link), depth) ||
                                    this.isProjectWithinProjectIgnored(link)) {
                                    return;
                                }
                                this.processDirectory(link);
                            })
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
                    this.updateCacheFile();
                    resolve(this.projectList);
                })
                .catch(() => { vscode.window.showErrorMessage(l10n.t("Error while loading projects.")); });
        });
    }

    private addToList(projectInfo: AutodetectedProjectInfo) {
        this.projectList.push(projectInfo);
    }

    private processDirectory = (absPath: string) => {
        if (this.excludeBaseFoldersFromResults && this.isBaseFolder(absPath)) {
            return;
        }
        if (this.repositoryDetector.isRepoDir(absPath)) {
            this.addToList(this.repositoryDetector.getProjectInfo(absPath));
        }
    };

    private processFile = (absPath: string) => {
        // Early filter: only process files with relevant extensions to improve performance
        // This avoids calling isRepoFile for every file in large directories
        if (this.supportedFileExtensions) {
            const fileExt = path.extname(absPath).toLowerCase();
            // Cached extensions are normalized to lowercase for comparison
            if (!this.supportedFileExtensions.includes(fileExt)) {
                return;
            }
        }
        if (this.repositoryDetector.isRepoFile && this.repositoryDetector.isRepoFile(absPath)) {
            this.addToList(this.repositoryDetector.getProjectInfo(absPath));
        }
    };

    private handleError(err) {
        console.log("Error walker:", err);
    }

    public refreshProjects(forceRefresh: boolean): Promise<boolean> {

        return new Promise((resolve, reject) => {
            
            if (!forceRefresh && !this.refreshConfig()) {
                resolve(false);
                return;
            }
    
            this.clearProjectList();
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
                    reject(error);
                });            
        });
    }

    public existsWithRootPath(rootPath: string): Project {
        
        // it only works if using `cache`
        if (!this.alreadyLocated) {
            return null;
        }

        for (const element of this.projectList) {
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

        currentValue = config.get(this.kind + ".excludeBaseFoldersFromResults", false);
        if (this.excludeBaseFoldersFromResults !== currentValue) {
            this.excludeBaseFoldersFromResults = currentValue;
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

    private isBaseFolder(folder: string): boolean {
        if (!this.baseFolders || this.baseFolders.length === 0) {
            return false;
        }

        const normalized = PathUtils.updateWithPathSeparator([folder])[0].toLowerCase();
        return this.baseFolders.some(base => base.toLowerCase() === normalized);
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
