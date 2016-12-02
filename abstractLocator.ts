let walker = require('walker');
let path = require('path');
let fs = require('fs');
let vscode = require('vscode');
 
export interface DirInfo {
    fullPath: string;
    name: string;
}
export interface DirList extends Array<DirInfo>{};

export abstract class AbstractLocator {

    private maxDepth: number;
    private ignoredFolders: string[];    
    
    constructor() {
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
    
    public initializeCfg(kind: string) {
        
        this.ignoredFolders = vscode.workspace.getConfiguration('projectManager').get(kind + '.ignoredFolders', []);
        this.maxDepth = vscode.workspace.getConfiguration('projectManager').get(kind + '.maxDepthRecursion', -1);
    }    

    public abstract locateProjects(projectsDirList);
    public abstract clearDirList();
    public abstract processDirectory(absPath: string, stat: any);
    public abstract getKind(): string;

    public handleError(err) {
        console.log('Error walker:', err);
    }
}