let walker = require('walker');
let path = require('path');
let fs = require('fs');
let vscode = require('vscode');
const cp = require('child_process');
import {AbstractLocator, DirInfo, DirList} from './abstractLocator';

export class SvnLocator extends AbstractLocator {

    public getKind(): string {
        return 'svn';
    }

    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, '.svn', 'pristine'));
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
    }
}