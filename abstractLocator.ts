let walker = require('walker');
let path = require('path');
let fs = require('fs');
let vscode = require('vscode');
let os = require('os');

const homeDir = os.homedir();
const CACHE_FILE = 'projects_cache_';

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
            if (this.alreadyLocated) {
                let cacheFile: string = this.getCacheFile();
                fs.writeFileSync(cacheFile, JSON.stringify(this.dirList, null, "\t"), {
                    encoding: 'utf8'
                });
            }
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
        } else {
            let cacheFile: string = this.getCacheFile();
            if (fs.existsSync(cacheFile)) {
                this.dirList = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
                this.setAlreadyLocated(true);
            }
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

    private getChannelPath(): string {
        if (vscode.env.appName.indexOf('Insiders') > 0) {
            return 'Code - Insiders';
        } else {
            return 'Code';
        }
    }   

    private getCacheFile() {
        let cacheFile: string;
        let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
        let channelPath: string = this.getChannelPath();
        cacheFile = path.join(appdata, channelPath, 'User', CACHE_FILE + this.getKind() + '.json');
        if ((process.platform == 'linux') && (!fs.existsSync(cacheFile))) {
            cacheFile = path.join(homeDir, '.config/', channelPath, 'User', CACHE_FILE + this.getKind() + '.json');
        }
        return cacheFile;
    }

    public refreshProjects(): void {
        this.clearDirList();
        let cacheFile: string = this.getCacheFile();
        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
        }
        this.setAlreadyLocated(false);
    }
}