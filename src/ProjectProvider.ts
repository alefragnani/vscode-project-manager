import * as vscode from "vscode";
import { CustomProjectLocator, DirInfo } from "./abstractLocator";
import { PathUtils } from "./PathUtils";
import { ProjectStorage } from "./storage";
import Tree from './tree';

export const NODE_KIND = 0;
export const NODE_PROJECT = 1;
export enum ProjectNodeKind { NODE_KIND, NODE_PROJECT };

export interface ProjectPreview {
  name: string;
  path: string;
};

interface ProjectInQuickPick {
  label: string;
  description: string;
  path?: any;
  isDirectory?: boolean;
}

export interface ProjectInQuickPickList extends Array<ProjectInQuickPick> {};

let context: vscode.ExtensionContext;

export class ProjectProvider implements vscode.TreeDataProvider<ProjectNode> {

  public readonly onDidChangeTreeData: vscode.Event<ProjectNode | undefined>;
  
  private projectSource: ProjectStorage | CustomProjectLocator;
  private tree!: Tree;
  private internalOnDidChangeTreeData: vscode.EventEmitter<ProjectNode | undefined> = new vscode.EventEmitter<ProjectNode | undefined>();

  constructor(projectSource: ProjectStorage | CustomProjectLocator, ctx: vscode.ExtensionContext) {
    this.projectSource = projectSource;
    this.onDidChangeTreeData = this.internalOnDidChangeTreeData.event;
    context = ctx;
  }

  public refresh(): void {
    this.internalOnDidChangeTreeData.fire();
  }

  public getTreeItem(element: ProjectNode): vscode.TreeItem {
    return element;
  }
  
  private sortProjects(list, sortByProperty: 'name' | 'label') {
    return list.sort((n1, n2) => {
      if (n1[sortByProperty] > n2[sortByProperty]) {
        return 1;
      }

      if (n1[sortByProperty] < n2[sortByProperty]) {
        return -1;
      }

      return 0;
    });
  }

  /**
   * getFavorites
   * @param parentPath 
   * @return ProjectNode[]
   */
  public getFavorites(parentPath = ''): ProjectNode[] {
    const projectStorage:  ProjectStorage = this.projectSource as  ProjectStorage;
    const list = <ProjectInQuickPickList>  projectStorage.map();
    const tree = new Tree(list);
    const root = tree.getChildren(parentPath);
    const projectNodes: ProjectNode[] = [];
    const projectsMapped = root; // <ProjectInQuickPickList> this.projectSource.map();

    this.sortProjects(projectsMapped, 'label');

    // tslint:disable-next-line:prefer-for-of
    for (let index = 0; index < projectsMapped.length; index++) {
      const prj: ProjectInQuickPick = projectsMapped[index];
    
      projectNodes.push(new ProjectNode(
        prj.label, 
        prj.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None,
        prj.isDirectory ? "favorites" : "vscode", 
        {
          name: prj.label,
          path: PathUtils.expandHomePath(prj.description)
        },
        {
          command: "projectManager.open",
          title: "",
          arguments: [PathUtils.expandHomePath(prj.description), prj.label],
        },
        prj.path
      ));
    }

    return projectNodes;
  }

  /**
   * getCustomProjectLocator
   * 
   * @return ProjectNode[]
   */
  public getCustomProjectLocator(): ProjectNode[] {
    const projectSource:  CustomProjectLocator = this.projectSource as  CustomProjectLocator;
    const projectNodes: ProjectNode[] = [];
    
    projectSource.initializeCfg(projectSource.kind);
    
    if (projectSource.dirList.length > 0) {

      this.sortProjects(projectSource.dirList, 'name');

      // tslint:disable-next-line:prefer-for-of
      for (let index = 0; index < projectSource.dirList.length; index++) {
        const dirinfo: DirInfo = projectSource.dirList[index];
        
        projectNodes.push(new ProjectNode(
          dirinfo.name, 
          vscode.TreeItemCollapsibleState.None,
          projectSource.displayName, 
          { name: dirinfo.name, path: dirinfo.fullPath },
          {
            command: "projectManager.open",
            title: "",
            arguments: [dirinfo.fullPath, projectSource.icon + " " + dirinfo.name],
          }
        ));
      }
    }

    return projectNodes;
  }

  public getChildren(element?: ProjectNode): Thenable<ProjectNode[]> {

    // loop !!!
    return new Promise(resolve => {

      if (element) {
        if (element.metadata) {
          // children of favorites
          resolve(this.getFavorites(element.metadata));
        } else {
          let ll: ProjectNode[] = [];

          ll.push(new ProjectNode(element.label, vscode.TreeItemCollapsibleState.None, "git", element.preview, {
            command: "projectManager.open",
            title: "",
            arguments: [element.preview.path],
          }));

          resolve(ll);
        }
      } else {
        // ROOT

        // raw list

        // favorites
        if (this.projectSource instanceof ProjectStorage) {
          resolve(this.getFavorites())
        }

        // Locators (VSCode/Git/Mercurial/SVN)
        if (this.projectSource instanceof CustomProjectLocator) {
          resolve(this.getCustomProjectLocator())
        }
      }
    });
  }

  public showTreeView(): void {
    const canShowTreeView: boolean = vscode.workspace.getConfiguration("projectManager").get("treeview.visible", true);
    if (this.projectSource instanceof ProjectStorage) {
      vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView" + "Favorites", canShowTreeView && this.projectSource.length() > 0);
      return;
    }

    if (this.projectSource instanceof CustomProjectLocator) {
      if (canShowTreeView) {
        this.projectSource.initializeCfg(this.projectSource.kind);
        vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView" + this.projectSource.displayName, 
        this.projectSource.dirList.length > 0);
      } else {
        vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView" + this.projectSource.displayName, false);
      }      
      return;
    }
  }
}

class ProjectNode extends vscode.TreeItem {
  public parent = '';

  constructor(
    public readonly label: string,
    public collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly icon: string,
    public readonly preview: ProjectPreview,
    public readonly command?: vscode.Command,
    public readonly metadata?: any
  ) {
    super(label, collapsibleState);

    this.iconPath = {
      light: context.asAbsolutePath(this.getProjectIcon(icon, "light")),
      dark: context.asAbsolutePath(this.getProjectIcon(icon, "dark"))
    };
    this.contextValue = "ProjectNodeKind";
    this.tooltip = preview.path;
  }

  private getProjectIcon(project: string, lightDark: string): string {
    return "images/ico-" + project.toLowerCase() + "-" + lightDark + ".svg";
  }
}