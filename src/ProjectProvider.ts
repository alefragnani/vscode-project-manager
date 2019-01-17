/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { CustomProjectLocator, DirInfo } from "./abstractLocator";
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

export interface ProjectInQuickPickList extends Array<ProjectInQuickPick> {};

let context: vscode.ExtensionContext;

export class ProjectProvider implements vscode.TreeDataProvider<ProjectNode> {

  public readonly onDidChangeTreeData: vscode.Event<ProjectNode | undefined>;
  
  private projectSource: ProjectStorage | CustomProjectLocator;
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

          // no project saved yet...
          if (this.projectSource.length() === 0) {
            lll.push(new ProjectNode("No projects saved yet.", 
              vscode.TreeItemCollapsibleState.None,
              undefined, {
                name: "No projects saved yet.",
                path: ""
              }/*,
              {
                command: "projectManager.saveProject",
                title: "",
                arguments: [vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined],
              }*/));
            return resolve(lll);
          }

          const projectsMapped = <ProjectInQuickPickList> this.projectSource.map();

          projectsMapped.sort((n1, n2) => {
            if (n1.label.toLowerCase() > n2.label.toLowerCase()) {
              return 1;
            }

            if (n1.label.toLowerCase() < n2.label.toLowerCase()) {
              return -1;
            }

            return 0;
          });

          // tslint:disable-next-line:prefer-for-of
          for (let index = 0; index < projectsMapped.length; index++) {
            const prj: ProjectInQuickPick = projectsMapped[index];
          
            // projects.push({
            //   name: prj.label,
            //   path: PathUtils.expandHomePath(prj.description)
            // });
            // lll.push(new ProjectNode("Favorites", vscode.TreeItemCollapsibleState.Collapsed, ProjectNodeKind.NODE_KIND, projects));
            lll.push(new ProjectNode(prj.label, vscode.TreeItemCollapsibleState.None,
              "favorites", {
                name: prj.label,
                path: PathUtils.expandHomePath(prj.description)
              },
              {
                command: "projectManager.open",
                title: "",
                arguments: [PathUtils.expandHomePath(prj.description), prj.label],
              }));
          }

        }

        // Locators (VSCode/Git/Mercurial/SVN)
        if (this.projectSource instanceof CustomProjectLocator) {
          const projects: ProjectPreview[] = [];
          this.projectSource.initializeCfg(this.projectSource.kind);
          
          if (this.projectSource.dirList.length > 0) {

            this.projectSource.dirList.sort((n1, n2) => {
              if (n1.name.toLowerCase() > n2.name.toLowerCase()) {
                return 1;
              }

              if (n1.name.toLowerCase() < n2.name.toLowerCase()) {
                return -1;
              }

              return 0;
            });

            // tslint:disable-next-line:prefer-for-of
            for (let index = 0; index < this.projectSource.dirList.length; index++) {
              const dirinfo: DirInfo = this.projectSource.dirList[index];
              
              // projects.push({
              //   name: dirinfo.name,
              //   path: dirinfo.fullPath
              // });
              // lll.push(new ProjectNode(this.projectSource.displayName, 
              //     vscode.TreeItemCollapsibleState.Collapsed, 
              //     ProjectNodeKind.NODE_KIND, projects));
              lll.push(new ProjectNode(dirinfo.name, vscode.TreeItemCollapsibleState.None,
                this.projectSource.displayName, {
                  name: dirinfo.name,
                  path: dirinfo.fullPath
                }, {
                  command: "projectManager.open",
                  title: "",
                  arguments: [dirinfo.fullPath, this.projectSource.icon + " " + dirinfo.name],
                }));
            }
          }
        }

        resolve(lll);
      }
    });
  }

  public showTreeView(): void {

    const canShowTreeView: boolean = vscode.workspace.getConfiguration("projectManager").get("treeview.visible", true);
    
    // The "Favorites" only depends on the "setting"
    if (this.projectSource instanceof ProjectStorage) {
      vscode.commands.executeCommand("setContext", "projectManager.canShowTreeViewFavorites", canShowTreeView);
      return;
    }
    
    // The "auto-detected" also depends if some project have been detected
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

  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly icon: string | undefined,
    public readonly preview: ProjectPreview,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    if (icon) {
      this.iconPath = {
        light: context.asAbsolutePath(this.getProjectIcon(icon, "light")),
        dark: context.asAbsolutePath(this.getProjectIcon(icon, "dark"))
      };        
      this.contextValue = "ProjectNodeKind";
    } else {
      this.contextValue = "ConfigNodeKind"
    }
    this.tooltip = preview.path;
  }

  private getProjectIcon(project: string, lightDark: string): string {
    return "images/ico-" + project.toLowerCase() + "-" + lightDark + ".svg";
  }
}