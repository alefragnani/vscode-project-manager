let walker = require('walker');
let path = require('path');
let fs = require('fs');
let vscode = require('vscode');
const cp = require('child_process');
import {AbstractLocator, DirInfo, DirList} from './abstractLocator';

let dirList: DirList = <DirList>[]; 

function addToList(dirPath: string, displayName: string = null) {
    dirList.push({
        fullPath: dirPath,
        name: displayName === null ? path.basename(dirPath) : displayName});
    return;
}

function extractRepoInfo(basePath) {

    var stdout = cp.execSync('git remote show origin -n', { cwd: basePath, encoding: 'utf8' });
    if (stdout.indexOf('Fetch URL:') === -1)
        return;

    var arr = stdout.split('\n');
    for (var i = 0; i < arr.length; i++) {
        var line = arr[i];
        var repoPath = 'Fetch URL: ';
        var idx = line.indexOf(repoPath);
        if (idx > -1)
            return line.trim().replace(repoPath, '');
    }
}

export class GitLocator extends AbstractLocator {

    public getKind(): string {
        return 'git';
    }

    public locateProjects(projectsDirList) {

        return new Promise<DirList> ( (resolve, reject) => {

        var promises = [];
        this.initializeCfg(this.getKind());
        this.clearDirList();

        projectsDirList.forEach((projectBasePath) => {
            if (!fs.existsSync(projectBasePath)) {
                    vscode.window.showWarningMessage('Directory ' + projectBasePath + ' does not exists.');

                return;
            }
            
            var depth = this.getPathDepth(projectBasePath);
            
            var promise = new Promise((resolve, reject) => {
                try {
                    walker(projectBasePath)
                        .filterDir(  (dir, stat) => {
                            return !(this.isFolderIgnored(path.basename(dir)) || 
                                this.isMaxDeptReached(this.getPathDepth(dir), depth)); 
                        } )
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
                vscode.window.setStatusBarMessage('PM-VSCode: Searching folders completed', 1500); 
                resolve(dirList); 
            } ) 
            .catch( error => { vscode.window.showErrorMessage('Error while loading VSCode Projects.');});
        });
    }

    public clearDirList() {
        dirList = [];
    }
    
    public processDirectory(absPath: string, stat: any) {    
        vscode.window.setStatusBarMessage(absPath, 600);
        if (fs.existsSync(path.join(absPath, '.git', 'config'))) {
            addToList(absPath, extractRepoInfo(absPath));
        }
    }
}