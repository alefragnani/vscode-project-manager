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
     * push
     */
    public push(name: string, rootPath: string, group: string): void {
        this.projectList.push(new ProjectItem(name, rootPath));
        return;
    }
    
    /**
     * pop
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
     * addPath
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
     * addPath
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
     * removePath
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
     * exists
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
     * exists
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
     * length
     */
    public length(): number {
        return this.projectList.length;        
    }

    public load(/*file: string*/): string {
        let items = [];

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
     * save
     */
    public save(/*file: string*/) {
        fs.writeFileSync(this.filename/* + '.new.json'*/, JSON.stringify(this.projectList, null, "\t"));
    }
    
    
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