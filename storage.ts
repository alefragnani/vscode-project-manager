import fs = require('fs');

// http://stackoverflow.com/questions/38161925/change-json-data-to-typescript-interface-objects-in-angular-2

export interface Project {
  name: string;     // the name that the user defines for the project
  rootPath: string; // the root path of this project
  paths: string[];  // the 'other paths' when you have multifolder project
  group: string;    // the group(s) that it belongs to
};

export interface ProjectList extends Array<Project>{};

class ProjectItem implements Project {
    
    name: string;     // the name that the user defines for the project
    rootPath: string; // the root path of this project
    paths: string[];  // the 'other paths' when you have multifolder project
    group: string;    // the group(s) that it belongs to

    constructor(pname: string, prootPath: string) {
        this.name = pname;
        this.rootPath = prootPath;
        this.paths = [];
        this.group = '';
    }
}

export class ProjectStorage {
    
    private projectList: ProjectList;
    private filename: string;

    constructor (filename: string) {
        this.filename = filename;
        this.projectList = <ProjectList>[];
    }
    
    /**
     * Adds a project to the list
     * 
     * @param `name` The [Project Name](#Project.name)
     * @param `rootPath` The [Project Rooth Path](#Project.rootPath)
     * @param `rootPath` The [Project Group](#Project.group)
     *
     * @return `void`
     */
    public push(name: string, rootPath: string, group: string): void {
        this.projectList.push(new ProjectItem(name, rootPath));
        return;
    }
    
    /**
     * Removes a project to the list
     * 
     * @param `name` The [Project Name](#Project.name)
     *
     * @return The [Project](#Project) that was removed
     */
    public pop(name: string): Project {
        for (var index = 0; index < this.projectList.length; index++) {
            var element: Project = this.projectList[index];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                return this.projectList.splice(index, 1)[0];
            }
        }
    }

    /**
     * Adds another `path` to a project
     * 
     * @param `name` The [Project Name](#Project.name)
     * @param `path` The [Project Path](#Project.paths)
     *
     * @return `void`
     */
    public addPath(name: string, path: string): void {
        for (let index = 0; index < this.projectList.length; index++) {
            let element: Project = this.projectList[index];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                this.projectList[index].paths.push(path);
            }
        }
    }

    /**
     * Updates the `rootPath` of a project
     * 
     * @param `name` The [Project Name](#Project.name)
     * @param `name` The [Project Root Path](#Project.rootPath)
     *
     * @return `void`
     */
    public updateRootPath(name: string, path: string): void {
        for (let index = 0; index < this.projectList.length; index++) {
            let element: Project = this.projectList[index];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                this.projectList[index].rootPath = path;
            }
        }
    }

    /**
     * Removes a `path` from a project
     * 
     * @param `name` The [Project Name](#Project.name)
     * @param `path` The [Project Path](#Project.paths)
     *
     * @return `void`
     */
    public removePath(name: string, path: string): void {
        for (let index = 0; index < this.projectList.length; index++) {
            let element: Project = this.projectList[index];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                //this.projectList[index].paths.push(path);

                for (var indexPath = 0; indexPath < element.paths.length; indexPath++) {
                    var elementPath = element.paths[indexPath];
                    if (elementPath.toLowerCase() == path.toLowerCase()) {
                        this.projectList[index].paths.splice(indexPath, 1);
                        return;
                    }
                }
            }
        }
    }

    /**
     * Checks if exists a project with a given `name`
     * 
     * @param `name` The [Project Name](#Project.name) to search for projects
     *
     * @return `true` or `false`
     */
    public exists(name: string): boolean {
        let found: boolean = false;
        
        for (let i = 0; i < this.projectList.length; i++) {
            let element = this.projectList[i];
            if (element.name.toLocaleLowerCase() == name.toLocaleLowerCase()) {
                found = true;
            }
        } 
        return found;       
    }
    

    /**
     * Checks if exists a project with a given `rootPath`
     * 
     * @param `rootPath` The path to search for projects
     *
     * @return A [Project](#Project) with the given `rootPath`
     */
    public existsWithRootPath(rootPath: string): Project {
        for (let i = 0; i < this.projectList.length; i++) {
            let element = this.projectList[i];
            if (element.rootPath.toLocaleLowerCase() == rootPath.toLocaleLowerCase()) {
                return element;
            }
        } 
    }
    
    /**
     * Returns the number of projects stored in `projects.json`
     * 
     * > The _dynamic projects_ like VSCode and Git aren't present
     *
     * @return The number of projects
     */
    public length(): number {
        return this.projectList.length;        
    }

    /**
     * Loads the `projects.json` file
     *
     * @return A `string` containing the _Error Message_ in case something goes wrong. An **empty string** if everything is ok.
     */
    public load(/*file: string*/): string {
        let items = [];

        // missing file (new install)
        if (!fs.existsSync(this.filename)) {
            this.projectList = items as ProjectList;
            return "";
        }

        try {
            items = JSON.parse(fs.readFileSync(this.filename).toString());

            // OLD format
            if ((items.length > 0) && (items[0].label)) {
                for (let index = 0; index < items.length; index++) {
                    let element = items[index];
                    this.projectList.push(new ProjectItem(element.label, element.description));
                }
                // save updated
                this.save();
            } else { // NEW format
                this.projectList = items as ProjectList;
                //this.projectList = <ProjectList>items;
            }
            return "";
        } catch (error) {
            return error.toString();
        }
    }

    /**
     * Saves the `projects.json` file to disk
     * 
     * @return `void`
     */
    public save() {
        fs.writeFileSync(this.filename, JSON.stringify(this.projectList, null, "\t"));
    }
    
    /**
     * Maps the projects to be used by a `showQuickPick`
     * 
     * @return A list of projects `{[label, description]}` to be used on a `showQuickPick`
     */    
    public map(): any {
        let newItems = this.projectList.map(item => {
            return {
              label: item.name,
              description: item.rootPath  
            };
        });
        return newItems;
    }
}