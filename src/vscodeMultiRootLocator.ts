import path = require("path");

export interface DirInfo {
    fullPath: string;
    name: string;
}
export interface DirList extends Array<DirInfo> { };

export class VisualStudioCodeMultiRootLocator {

    public dirList: DirList = <DirList>[];
    private workspaces;

    public locateProjects(workspaces) {

        this.workspaces = workspaces;

        return new Promise<DirList>((resolve, reject) => {

            // initialize
            this.dirList = [];

            //     "folders": [
            //         "file:///c%3A/Users/alessandrofm/Downloads/Virtual-TreeView",
            //         "file:///c%3A/Users/alessandrofm/Downloads/SAXforPascal1-1/SAX%20for%20Pascal"
            //     ]
            // },

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
        return projectPath.substr(8); // file:///
    }

    public decideProjectName(projectPath: string): string {
        return path.basename(projectPath);
    }
}