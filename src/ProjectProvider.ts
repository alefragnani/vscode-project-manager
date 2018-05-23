import * as vscode from "vscode";
import { AbstractLocator, DirInfo } from "./abstractLocator";
import { PathUtils } from "./PathUtils";
import { ProjectStorage } from "./storage";

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
}

export interface ProjectInQuickPickList extends Array<ProjectInQuickPick> { };

let context: vscode.ExtensionContext;

export class ProjectProvider implements vscode.TreeDataProvider<ProjectNode> {

  private projectSource: ProjectStorage | AbstractLocator;
  private _onDidChangeTreeData: vscode.EventEmitter<ProjectNode | undefined> = new vscode.EventEmitter<ProjectNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<ProjectNode | undefined> = this._onDidChangeTreeData.event;

  constructor(projectSource: ProjectStorage | AbstractLocator, ctx: vscode.ExtensionContext) {
    this.projectSource = projectSource;
    context = ctx;
  }

  public refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  public getTreeItem(element: ProjectNode): vscode.TreeItem {
    return element;
  }

  public getChildren(element?: ProjectNode): Thenable<ProjectNode[]> {

    // loop !!!
    return new Promise(resolve => {

      if (element) {
        
        const ll: ProjectNode[] = [];

        ll.push(new ProjectNode(element.label, vscode.TreeItemCollapsibleState.None, "git", element.preview, {
          command: "projectManager.open",
          title: "",
          arguments: [element.preview.path],
        }));

        resolve(ll);

      } else {

        // ROOT

        // raw list
        const lll: ProjectNode[] = [];

        // favorites
        if (this.projectSource instanceof ProjectStorage) {
          const projectsMapped = <ProjectInQuickPickList>this.projectSource.map();
          const projects: ProjectPreview[] = [];

          projectsMapped.sort((n1, n2) => {
            if (n1.label > n2.label) {
              return 1;
            }

            if (n1.label < n2.label) {
              return -1;
            }

            return 0;
          });


          // tslint:disable-next-line:prefer-for-of
          for (let index = 0; index < projectsMapped.length; index++) {
            const prj: ProjectInQuickPick = projectsMapped[index];

            lll.push(new ProjectNode(prj.label, vscode.TreeItemCollapsibleState.None,
              "favorites", {
                name: prj.label,
                path: PathUtils.expandHomePath(prj.description)
              },
              {
                command: "projectManager.open",
                title: "",
                arguments: [PathUtils.expandHomePath(prj.description)],
              }));
          }
        }

        // Locators (VSCode/Git/SVN)
        if (this.projectSource instanceof AbstractLocator) {
          const projects: ProjectPreview[] = [];
          this.projectSource.initializeCfg(this.projectSource.getKind());

          if (this.projectSource.dirList.length > 0) {

            this.projectSource.dirList.sort((n1, n2) => {
              if (n1.name > n2.name) {
                return 1;
              }

              if (n1.name < n2.name) {
                return -1;
              }

              return 0;
            });

            // tslint:disable-next-line:prefer-for-of
            for (let index = 0; index < this.projectSource.dirList.length; index++) {
              const dirinfo: DirInfo = this.projectSource.dirList[index];

              lll.push(new ProjectNode(dirinfo.name, vscode.TreeItemCollapsibleState.None,
                this.projectSource.getDisplayName(), {
                  name: dirinfo.name,
                  path: dirinfo.fullPath
                }, {
                  command: "projectManager.open",
                  title: "",
                  arguments: [dirinfo.fullPath],
                }));
            }
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
    public readonly icon: string,
    public readonly preview: ProjectPreview,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    this.iconPath = {
      light: context.asAbsolutePath(this.getProjectIcon(icon, "light")),
      dark: context.asAbsolutePath(this.getProjectIcon(icon, "dark"))
    };
    this.contextValue = "ProjectNodeProject";
  }

  private getProjectIcon(project: string, lightDark: string): string {
    return "images/ico-" + project.toLowerCase() + "-" + lightDark + ".svg";
  }
}