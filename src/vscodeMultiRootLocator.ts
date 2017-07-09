import path = require("path");

export interface DirInfo {
    fullPath: string;
    name: string;
}
export interface DirList extends Array<DirInfo> { };

export class VisualStudioCodeMultiRootLocator {

    public dirList: DirList = <DirList> [];
    private workspaces;

    public locateProjects(workspaces) {

        this.workspaces = workspaces;

        return new Promise<DirList>((resolve, reject) => {

            // initialize
            this.dirList = [];

            //     "file:///c:/Users/alefr/Documents/GitHub/_forks/vscode-go": {
            //         "folders": [
            //             "file:///c:/Users/alefr/Documents/GitHub/_forks/vscode-docs",
            //             "file:///c:/Users/alefr/Documents/GitHub/_forks/vscode-extension-samples"
            //         ]
            //     }

            // loop multi-root projects
            for (let property in workspaces) {
                if (workspaces.hasOwnProperty(property)) {
                    this.addToList(this.removeURI(property), this.decideProjectName(property));
                }
            }
            resolve(<DirList> this.dirList);
            return;
        });
    }

    public addToList(projectPath: string, projectName: string = null) {
        this.dirList.push({
            fullPath: projectPath,
            name: projectName === null ? path.basename(projectPath) : projectName
        });
        return;
    }

    public removeURI(projectPath: string): string {
        let normPath = projectPath.substr(8); // file:///
        if (process.platform === "win32") {
            normPath = normPath.replace(/\//g, "\\");
        }
        return normPath;
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
    }
}