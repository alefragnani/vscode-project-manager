import * as vscode from "vscode";
import { ProjectStorage, Project } from "./storage";
import { VisualStudioCodeLocator } from "./vscodeLocator";
import { GitLocator } from "./gitLocator";
import { SvnLocator } from "./svnLocator";
// import { Bookmark } from "./Bookmark";
// import { Bookmarks } from "./Bookmarks";

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
let hasIcons: boolean = vscode.workspace.getConfiguration("workbench").get("iconTheme", "") !== null;

export class ProjectProvider implements vscode.TreeDataProvider<ProjectNode> {

  private _onDidChangeTreeData: vscode.EventEmitter<ProjectNode | undefined> = new vscode.EventEmitter<ProjectNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ProjectNode | undefined> = this._onDidChangeTreeData.event;

  private tree: ProjectNode[] = [];

  constructor(private workspaceRoot: string, private projectStorage: ProjectStorage, private vscLocator: VisualStudioCodeLocator,
    private gitLocator: GitLocator, private svnLocator: SvnLocator, ctx: vscode.ExtensionContext) {

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

          for (let bbb of element.books) {
            ll.push(new ProjectNode(bbb.name, vscode.TreeItemCollapsibleState.None, ProjectNodeKind.NODE_PROJECT, null, {
              command: "projectManager.open",
              title: "",
              arguments: [bbb.name, bbb.path],
            }));
          }

          resolve(ll);
        } else {
          resolve([]);
        }
        
      } else {

        // ROOT

        let x: Coisa;

        // raw list
        let lll: ProjectNode[] = [];
            
        // favorites
        if (this.projectStorage.length() > 0) {

          let projectsMapped = <CoisaList>this.projectStorage.map();
          let projects: ProjectPreview[] = [];

          for (let index = 0; index < projectsMapped.length; index++) {
            let element: Coisa = projectsMapped[index];
          
            projects.push({
              name: element.label,
              path: element.description
            });
          }

          lll.push(new ProjectNode("Favorites", vscode.TreeItemCollapsibleState.Collapsed, ProjectNodeKind.NODE_KIND, projects));
        }

        // 
        resolve(lll);
      }
    });
  }

}

function removeRootPathFrom(path: string): string {
  if (!vscode.workspace.rootPath) {
    return path;
  }

  if (path.indexOf(vscode.workspace.rootPath) === 0) {
    return path.split(vscode.workspace.rootPath).pop().substr(1);
  } else {
    return path;
  }
}

class ProjectNode extends vscode.TreeItem {

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly kind: ProjectNodeKind,

   // public readonly bookmark: Bookmark,
    public readonly books?: ProjectPreview[],
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    if (kind === ProjectNodeKind.NODE_KIND) {
      if (hasIcons) {
        this.iconPath = {
          light: context.asAbsolutePath("images/bookmark-explorer-light.svg"),
          dark: context.asAbsolutePath("images/bookmark-explorer-dark.svg")
        };
      }
      this.contextValue = "ProjectNodeKind";
    } else {
      this.iconPath = {
        light: context.asAbsolutePath("images/bookmark.svg"),
        dark: context.asAbsolutePath("images/bookmark.svg")
      };
      this.contextValue = "ProjectNodeProject";
    }
  }

  // contextValue = "BookmarkNode";

}