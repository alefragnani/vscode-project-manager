 let walker = require('walker');
 let path = require('path');
 let fs = require('fs');
 let vscode = require('vscode');
 
export interface DirInfo {
    fullPath: string;
    name: string;
}
export interface DirList extends Array<DirInfo>{};

let dirList: DirList = <DirList>[]; 

function addToList(dirPath: string) {
    dirList.push({
        fullPath: dirPath,
        name: path.basename(dirPath)});
    return;
}

export class VisualStudioCodeLocator {

    //private dirList: DirList; 
    private maxDepth: number;
    private ignoredFolders: string[];    
    
    constructor() {
        //this.dirList = <DirList>[];
        this.maxDepth = -1;
        this.ignoredFolders = [];
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
    
    public initializeCfg() {
        
        this.ignoredFolders = vscode.workspace.getConfiguration('projectManager').get('vscode.ignoredFolders', []);
        this.maxDepth = vscode.workspace.getConfiguration('projectManager').get('vscode.maxDepthRecursion', -1);
    }

    public locateProjects(projectsDirList) {

        return new Promise<DirList> ( (resolve, reject) => {

        var promises = [];
        this.initializeCfg();
        this.clearDirList();

        projectsDirList.forEach((projectBasePath) => {
            if (!fs.existsSync(projectBasePath)) {
                //if (warnFoldersNotFound)
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

    public clearDirList()  {
        dirList = [];
    }

    public processDirectory(absPath: string, stat: any) {    
        vscode.window.setStatusBarMessage(absPath, 600);
        if (fs.existsSync(path.join(absPath, '.vscode'))) {
            addToList(absPath);
        }
    }

    public handleError(err) {
        console.log('Error walker:', err);
    }
}