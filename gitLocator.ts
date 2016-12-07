let walker = require('walker');
let path = require('path');
let fs = require('fs');
let vscode = require('vscode');
const cp = require('child_process');
import {AbstractLocator, DirInfo, DirList} from './abstractLocator';

export class GitLocator extends AbstractLocator {

    public getKind(): string {
        return 'git';
    }

    public isRepoDir(projectPath: string) {
        return fs.existsSync(path.join(projectPath, '.git', 'config'));
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
        // var stdout = cp.execSync('git remote show origin -n', { cwd: projectPath, encoding: 'utf8' });
        // if (stdout.indexOf('Fetch URL:') === -1)
        //     return;

        // var arr = stdout.split('\n');
        // for (var i = 0; i < arr.length; i++) {
        //     var line = arr[i];
        //     var repoPath = 'Fetch URL: ';
        //     var idx = line.indexOf(repoPath);
        //     if (idx > -1)
        //         return line.trim().replace(repoPath, '');
        // }
    }
}