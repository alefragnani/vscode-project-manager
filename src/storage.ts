import fs = require("fs");
import { PathUtils } from "./PathUtils";

// http://stackoverflow.com/questions/38161925/change-json-data-to-typescript-interface-objects-in-angular-2

export interface Project {
  name: string;     // the name that the user defines for the project
  rootPath: string; // the root path of this project
  paths: string[];  // the 'other paths' when you have multifolder project
  group: string;    // the group(s) that it belongs to
  enabled: boolean; // the project should be displayed in the project list
};

export interface ProjectList extends Array<Project> {};

class ProjectItem implements Project {
    
    public name: string;     // the name that the user defines for the project
    public rootPath: string; // the root path of this project
    public paths: string[];  // the 'other paths' when you have multifolder project
    public group: string;    // the group(s) that it belongs to
    public enabled: boolean; // the project should be displayed in the project list

    constructor(pname: string, prootPath: string) {
        this.name = pname;
        this.rootPath = prootPath;
        this.paths = [];
        this.group = "";
        this.enabled = true;
    }
}

export class ProjectStorage {

    private projectList: ProjectList;
    private filename: string;

    constructor(filename: string) {
        this.filename = filename;
        this.projectList = <ProjectList> [];
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
        for (let index = 0; index < this.projectList.length; index++) {
            const element: Project = this.projectList[index];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                return this.projectList.splice(index, 1)[0];
            }
        }
    }
    
    /**
     * Removes a project to the list
     * 
     * @param `name` The [Project Name](#Project.name)
     *
     * @return The [Project](#Project) that was removed
     */
    public rename(oldName: string, newName: string): void {
        // for (let index = 0; index < this.projectList.length; index++) {
        //     const element: Project = this.projectList[index];
        for (const element of this.projectList) {
            if (element.name.toLowerCase() === oldName.toLowerCase()) {
                element.name = newName;
                return;
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
        // for (let index = 0; index < this.projectList.length; index++) {
        for (const element of this.projectList) {
            // let element: Project = this.projectList[index];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                // this.projectList[index].paths.push(path);
                element.paths.push(path);
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
        // for (let index = 0; index < this.projectList.length; index++) {
        for (const element of this.projectList) {
            // let element: Project = this.projectList[index];
            if (element.name.toLowerCase() === name.toLowerCase()) {
                // this.projectList[index].rootPath = path;
                element.rootPath = path;
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
        // for (let index = 0; index < this.projectList.length; index++) {
        for (const element of this.projectList) {
            // let element: Project = this.projectList[index];
            if (element.name.toLowerCase() === name.toLowerCase()) {

                for (let indexPath = 0; indexPath < element.paths.length; indexPath++) {
                    const elementPath = element.paths[indexPath];
                    if (elementPath.toLowerCase() === path.toLowerCase()) {
                        // this.projectList[index].paths.splice(indexPath, 1);
                        element.paths.splice(indexPath, 1);
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
        
        // for (let i = 0; i < this.projectList.length; i++) {
        for (const element of this.projectList) {
            // let element = this.projectList[i];
            if (element.name.toLocaleLowerCase() === name.toLocaleLowerCase()) {
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
        const rootPathUsingHome: string = PathUtils.compactHomePath(rootPath).toLocaleLowerCase();

        for (const element of this.projectList) {
            if ((element.rootPath.toLocaleLowerCase() === rootPath.toLocaleLowerCase()) || (element.rootPath.toLocaleLowerCase() === rootPathUsingHome)) {
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
     * @return A `string` containing the _Error Message_ in case something goes wrong. 
     *         An **empty string** if everything is ok.
     */
    public load(): string {
        let items: Array<any> = [];

        // missing file (new install)
        if (!fs.existsSync(this.filename)) {
            this.projectList = items as ProjectList;
            return "";
        }

        try {
            items = JSON.parse(fs.readFileSync(this.filename).toString());
            // OLD format
            if ((items.length > 0) && (items[0].label)) {
                for (const element of items) {
                    this.projectList.push(new ProjectItem(element.label, element.description));
                }
                // save updated
                this.save();
            } else { // NEW format
                this.projectList = (items as Array<Partial<Project>>).map(item => ({
                    name: '',
                    rootPath: '',
                    paths: [],
                    group: '',
                    enabled: true,
                    ...item
                }));
            }

            this.updatePaths();
            return "";
        } catch (error) {
            console.log(error);
            return error.toString();
        }
    }

    /**
     * Reloads the `projects.json` file. 
     * 
     * > Using a forced _reload_ instead of a _watcher_ 
     *
     * @return `void`
     */
    public reload() {
        let items = [];

        // missing file (new install)
        if (!fs.existsSync(this.filename)) {
            this.projectList = items as ProjectList;
        } else {
            items = JSON.parse(fs.readFileSync(this.filename).toString());
            this.projectList = items as ProjectList;
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
        const newItems = this.projectList.filter(item => item.enabled).map(item => {
            return {
              label: item.name,
              description: item.rootPath  
            };
        });
        return newItems;
    }

    private updatePaths(): void {
        for (const project of this.projectList) {
            project.rootPath = PathUtils.updateWithPathSeparatorStr(project.rootPath);
        }
    }
}
