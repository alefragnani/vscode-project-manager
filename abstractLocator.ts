let walker = require('walker');
let path = require('path');
let fs = require('fs');
let vscode = require('vscode');

export interface DirInfo {
    fullPath: string;
    name: string;
}
export interface DirList extends Array<DirInfo> { };

export abstract class AbstractLocator {

    public dirList: DirList = <DirList>[];
    private maxDepth: number;
    private ignoredFolders: string[];
    private useCachedRepos: boolean;
    private alreadyLocated: boolean;

    constructor() {
        this.maxDepth = -1;
        this.ignoredFolders = [];
        this.useCachedRepos = true;
        this.alreadyLocated = false;
    }

    public abstract getKind(): string;
    public abstract decideProjectName(projectPath: string): string;
    public abstract isRepoDir(projectPath: string): boolean;


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
        return this.useCachedRepos && this.alreadyLocated;
    }

    public setAlreadyLocated(al: boolean): void {
        if (this.useCachedRepos) {
            this.alreadyLocated = al;
        }
    }

    public clearDirList() {
        this.dirList = [];
    }

    public initializeCfg(kind: string) {

        this.ignoredFolders = vscode.workspace.getConfiguration('projectManager').get(kind + '.ignoredFolders', []);
        this.maxDepth = vscode.workspace.getConfiguration('projectManager').get(kind + '.maxDepthRecursion', -1);
        this.useCachedRepos = vscode.workspace.getConfiguration('projectManager').get('cacheRepos', true);
        if (!this.useCachedRepos) {
            this.clearDirList();
        }
    }

    public locateProjects(projectsDirList) {

        return new Promise<DirList>((resolve, reject) => {

            if (projectsDirList.length == 0) {
                resolve(<DirList>[]);
                return;
            }

            this.initializeCfg(this.getKind());
            if (this.isAlreadyLocated()) {
                resolve(this.dirList)
                return;
            }

            var promises = [];
            this.clearDirList();

            projectsDirList.forEach((projectBasePath) => {
                if (!fs.existsSync(projectBasePath)) {
                    vscode.window.setStatusBarMessage('Directory ' + projectBasePath + ' does not exists.', 1500);

                    return;
                }

                var depth = this.getPathDepth(projectBasePath);

                var promise = new Promise((resolve, reject) => {
                    try {
                        walker(projectBasePath)
                            .filterDir((dir, stat) => {
                                return !(this.isFolderIgnored(path.basename(dir)) ||
                                    this.isMaxDeptReached(this.getPathDepth(dir), depth));
                            })
                            .on('dir', this.processDirectory)
                            .on('error', this.handleError)
                            .on('end', () => {
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
                    vscode.window.setStatusBarMessage('Searching folders completed', 1500);
                    this.setAlreadyLocated(true);
                    resolve(this.dirList);
                })
                .catch(error => { vscode.window.showErrorMessage('Error while loading projects.'); });
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
        console.log('Error walker:', err);
    }
}