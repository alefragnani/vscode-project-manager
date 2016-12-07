let walker = require('walker');
let path = require('path');
let fs = require('fs');
let vscode = require('vscode');
import {AbstractLocator, DirInfo, DirList} from './abstractLocator';

export class VisualStudioCodeLocator extends AbstractLocator {

    public getKind(): string {
        return 'vscode';
    }

    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, '.vscode'));
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
    }    
}