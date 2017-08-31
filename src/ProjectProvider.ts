import * as vscode from "vscode";
import { AbstractLocator, DirInfo } from "./abstractLocator";
import { ProjectStorage } from "./storage";

export const NODE_KIND = 0;
export const NODE_PROJECT = 1;
export enum ProjectNodeKind { NODE_KIND, NODE_PROJECT };

export interface ProjectPreview {
  name: string;
  path: string;
};

interface Coisa {
  label: string;
  description: string;
}
export interface CoisaList extends Array<Coisa> {};

let context: vscode.ExtensionContext;

export class ProjectProvider implements vscode.TreeDataProvider<ProjectNode> {

  private _onDidChangeTreeData: vscode.EventEmitter<ProjectNode | undefined> = new vscode.EventEmitter<ProjectNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ProjectNode | undefined> = this._onDidChangeTreeData.event;

  constructor(private workspaceRoot: string, private projectStorage: ProjectStorage, private locators: AbstractLocator[], ctx: vscode.ExtensionContext) {

    context = ctx;

    // projectStorage.onDidUpdateProject(prj => {
    //   this._onDidChangeTreeData.fire();
    // });
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ProjectNode): vscode.TreeItem {
    return element;
  }

  // very much based in `listFromAllFiles` command
  getChildren(element?: ProjectNode): Thenable<ProjectNode[]> {

    // no bookmark
    // let totalBookmarkCount: number = 0;
    // for (let elem of this.bookmarks.bookmarks) {
    //   totalBookmarkCount = totalBookmarkCount + elem.bookmarks.length;
    // }

    // if (totalBookmarkCount === 0) {
    //   // vscode.window.showInformationMessage("No Bookmarks in this project.");
    //   this.tree = [];
    //   return Promise.resolve([]);
    // }

    // loop !!!
    return new Promise(resolve => {

      if (element) {

        if (element.kind === ProjectNodeKind.NODE_KIND) {
          let ll: ProjectNode[] = [];

          for (let bbb of element.projects) {
            ll.push(new ProjectNode(bbb.name, vscode.TreeItemCollapsibleState.None, ProjectNodeKind.NODE_PROJECT, null, {
              command: "projectManager.open",
              title: "",
              arguments: [bbb.path],
            }));
          }

          resolve(ll);
        } else {
          resolve([]);
        }
        
      } else {

        // ROOT

        // raw list
        let lll: ProjectNode[] = [];
            
        // favorites
        if (this.projectStorage.length() > 0) {

          let projectsMapped = <CoisaList> this.projectStorage.map();
          let projects: ProjectPreview[] = [];

          for (let index = 0; index < projectsMapped.length; index++) {
            let prj: Coisa = projectsMapped[index];
          
            projects.push({
              name: prj.label,
              path: prj.description
            });
          }

          lll.push(new ProjectNode("Favorites", vscode.TreeItemCollapsibleState.Collapsed, ProjectNodeKind.NODE_KIND, projects));
        }

        for (let locator of this.locators) {
          let projects: ProjectPreview[] = [];
          locator.initializeCfg(locator.getKind());

          if (locator.dirList.length > 0) {
            for (let index = 0; index < locator.dirList.length; index++) {
              let dirinfo: DirInfo = locator.dirList[index];
              
              projects.push({
                name: dirinfo.name,
                path: dirinfo.fullPath
              });
            }
            lll.push(new ProjectNode(locator.getDisplayName(), vscode.TreeItemCollapsibleState.Collapsed, ProjectNodeKind.NODE_KIND, projects));
          }
        }

        resolve(lll);
      }
    });
  }

}

class ProjectNode extends vscode.TreeItem {

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly kind: ProjectNodeKind,
    public readonly projects?: ProjectPreview[],
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    if (kind === ProjectNodeKind.NODE_KIND) {
      this.iconPath = {
        light: context.asAbsolutePath("images/ico-project-light.svg"),
        dark: context.asAbsolutePath("images/ico-project-dark.svg")
      };
      this.contextValue = "ProjectNodeKind";
    } else {
      this.iconPath = {
        light: context.asAbsolutePath("images/ico-project-light.svg"),
        dark: context.asAbsolutePath("images/ico-project-dark.svg")
      };
      this.contextValue = "ProjectNodeProject";
    }
  }
}