/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { CustomProjectLocator } from "../autodetect/abstractLocator";
import { ProjectNode } from "./nodes";
import { Container } from "../core/container";
import { addParentFolderToDuplicates } from "../utils/path";

export class AutodetectProvider implements vscode.TreeDataProvider<ProjectNode> {

    public readonly onDidChangeTreeData: vscode.Event<ProjectNode | void>;

    private projectSource: CustomProjectLocator;
    private internalOnDidChangeTreeData: vscode.EventEmitter<ProjectNode | void> = new vscode.EventEmitter<ProjectNode | void>();

    constructor(projectSource: CustomProjectLocator) {
        this.projectSource = projectSource;
        this.onDidChangeTreeData = this.internalOnDidChangeTreeData.event;
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
                    command: "_projectManager.open",
                    title: "",
                    arguments: [ element.preview.path ],
                }));

                resolve(ll);

            } else {

                // ROOT

                // raw list
                const lll: ProjectNode[] = [];

                // Locators (VSCode/Git/Mercurial/SVN)
                // this.projectSource.initializeCfg(this.projectSource.kind);

                if (this.projectSource.projectList.length > 0) {

                    this.projectSource.projectList.sort((n1, n2) => {
                        if (n1.name.toLowerCase() > n2.name.toLowerCase()) {
                            return 1;
                        }

                        if (n1.name.toLowerCase() < n2.name.toLowerCase()) {
                            return -1;
                        }

                        return 0;
                    });

                    const projectsWithParent = addParentFolderToDuplicates(this.projectSource.projectList);

                    for (let index = 0; index < projectsWithParent.length; index++) {
                        const dirinfo = projectsWithParent[ index ];

                        lll.push(new ProjectNode(dirinfo.name, vscode.TreeItemCollapsibleState.None,
                            dirinfo.icon, {
                                name: dirinfo.name,
                                detail: dirinfo.parent,
                                path: dirinfo.path
                            }, {
                                command: "_projectManager.open",
                                title: "",
                                arguments: [ dirinfo.path, dirinfo.name ],
                            }));
                    }
                }

                resolve(lll);
            }
        });
    }

    public async showTreeView(): Promise<void> {

        // The "auto-detected" views depends if some project have been detected
        // this.projectSource.initializeCfg(this.projectSource.kind);
        if (!this.projectSource.isAlreadyLocated()) {
            await this.projectSource.locateProjects();
        }

        if (this.projectSource.displayName === "Git") {
            const hideGitWelcome = Container.context.globalState.get<boolean>("hideGitWelcome", false);
            vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView" + this.projectSource.displayName,
                this.projectSource.projectList.length > 0 || !hideGitWelcome);
        } else {
            vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView" + this.projectSource.displayName,
                this.projectSource.projectList.length > 0);
        }
        return;
    }

}
