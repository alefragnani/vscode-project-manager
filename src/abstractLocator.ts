// const walker = require("walker");
import fs = require("fs");
import path = require("path");
import vscode = require("vscode");
import walker = require("walker");
// import os = require("os");
import { homeDir, PathUtils } from "./PathUtils";
import { Project } from "./storage";

// const homeDir = os.homedir();
const CACHE_FILE = "projects_cache_";

export interface DirInfo {
    fullPath: string;
    name: string;
}
export interface DirList extends Array<DirInfo> { };

export abstract class AbstractLocator {

    public dirList: DirList = <DirList> [];
    private maxDepth: number;
    private ignoredFolders: string[];
    private useCachedProjects: boolean;
    private alreadyLocated: boolean;
    private baseFolders: string[];

    constructor() {
        this.maxDepth = -1;
        this.ignoredFolders = [];
        this.useCachedProjects = true;
        this.alreadyLocated = false;
        this.baseFolders = [];

        //
        this.ignoredFolders = vscode.workspace.getConfiguration("projectManager").get(this.getKind() + ".ignoredFolders", []);
        this.maxDepth = vscode.workspace.getConfiguration("projectManager").get(this.getKind() + ".maxDepthRecursion", -1);
        this.useCachedProjects = vscode.workspace.getConfiguration("projectManager").get("cacheProjectsBetweenSessions", true);
        this.baseFolders = vscode.workspace.getConfiguration("projectManager").get<string[]>(this.getKind() + ".baseFolders");

    }

    public abstract getKind(): string;
    public abstract getDisplayName(): string;
    public abstract decideProjectName(projectPath: string): string;
    public abstract isRepoDir(projectPath: string): boolean;

    public getBaseFolders(): string[] {
        return this.baseFolders;
    }

    public getPathDepth(s) {
        return s.split(path.sep).length;
    }

    public isMaxDeptReached(currentDepth, initialDepth) {
        return (this.maxDepth > 0) && ((currentDepth - initialDepth) > this.maxDepth);
    }

    public isFolderIgnored(folder) {
        return this.ignoredFolders.indexOf(folder) !== -1;
    }

    public isAlreadyLocated(): boolean {
        return this.useCachedProjects && this.alreadyLocated;
    }

    public setAlreadyLocated(al: boolean): void {
        if (this.useCachedProjects) {
            this.alreadyLocated = al;
            if (this.alreadyLocated) {
                const cacheFile: string = this.getCacheFile();
                fs.writeFileSync(cacheFile, JSON.stringify(this.dirList, null, "\t"), { encoding: "utf8" });
            }
        }
    }

    public clearDirList() {
        this.dirList = [];
    }

    public initializeCfg(kind: string) {

        // this.ignoredFolders = vscode.workspace.getConfiguration("projectManager").get(kind + ".ignoredFolders", []);
        // this.maxDepth = vscode.workspace.getConfiguration("projectManager").get(kind + ".maxDepthRecursion", -1);
        // this.useCachedProjects = vscode.workspace.getConfiguration("projectManager").get("cacheProjectsBetweenSessions", true);
        if (!this.useCachedProjects) {
            this.clearDirList();
        } else {
            const cacheFile: string = this.getCacheFile();
            if (fs.existsSync(cacheFile)) {
                this.dirList = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
                this.setAlreadyLocated(true);
            }
        }
    }

    public locateProjects(projectsDirList) {

        this.baseFolders = projectsDirList.slice();

        return new Promise<DirList>((resolve, reject) => {

            if (projectsDirList.length === 0) {
                resolve(<DirList> []);
                return;
            }

            this.initializeCfg(this.getKind());
            if (this.isAlreadyLocated()) {
                resolve(this.dirList);
                return;
            }

            const promises = [];
            this.clearDirList();

            projectsDirList.forEach((projectBasePath) => {
                const expandedBasePath: string = PathUtils.expandHomePath(projectBasePath);
                if (!fs.existsSync(expandedBasePath)) {
                    vscode.window.setStatusBarMessage("Directory " + expandedBasePath + " does not exists.", 1500);

                    return;
                }

                const depth = this.getPathDepth(expandedBasePath);

                const promise = new Promise((resolve, reject) => {
                    try {
                        walker(expandedBasePath)
                            .filterDir((dir, stat) => {
                                return !(this.isFolderIgnored(path.basename(dir)) ||
                                    this.isMaxDeptReached(this.getPathDepth(dir), depth));
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
                    vscode.window.setStatusBarMessage("Searching folders completed", 1500);
                    this.setAlreadyLocated(true);
                    resolve(this.dirList);
                })
                .catch(error => { vscode.window.showErrorMessage("Error while loading projects."); });
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
        vscode.window.setStatusBarMessage(absPath, 600);
        if (this.isRepoDir(absPath)) {
            this.addToList(absPath, this.decideProjectName(absPath));
        }
    }

    public handleError(err) {
        console.log("Error walker:", err);
    }

    public refreshProjects(projectsDirList?): void {
        this.clearDirList();
        const cacheFile: string = this.getCacheFile();
        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
        }
        this.setAlreadyLocated(false);

        if (projectsDirList) {
            this.locateProjects(projectsDirList);
        }
    }

    public existsWithRootPath(rootPath: string): Project {
        
        // it only works if using `cache`
        this.initializeCfg(this.getKind());
        if (!this.isAlreadyLocated()) {
            return null;
        }

        const rootPathUsingHome: string = PathUtils.compactHomePath(rootPath).toLocaleLowerCase();
        for (const element of this.dirList) {
            if ((element.fullPath.toLocaleLowerCase() === rootPath.toLocaleLowerCase()) || (element.fullPath.toLocaleLowerCase() === rootPathUsingHome)) {
                return {
                    rootPath: element.fullPath,
                    name: element.name,
                    group: "",
                    paths: [] 
                };
            }
        }
    }

    private getChannelPath(): string {
        if (vscode.env.appName.indexOf("Insiders") > 0) {
            return "Code - Insiders";
        } else {
            return "Code";
        }
    }

    private getCacheFile() {
        let cacheFile: string;
        const appdata = process.env.APPDATA || (process.platform === "darwin" ? process.env.HOME + "/Library/Application Support" : "/var/local");
        const channelPath: string = this.getChannelPath();
        cacheFile = path.join(appdata, channelPath, "User", CACHE_FILE + this.getKind() + ".json");
        if ((process.platform === "linux") && (!fs.existsSync(cacheFile))) {
            cacheFile = path.join(homeDir, ".config/", channelPath, "User", CACHE_FILE + this.getKind() + ".json");
        }
        return cacheFile;
    }

}