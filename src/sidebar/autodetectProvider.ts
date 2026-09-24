/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { CustomProjectLocator } from "../autodetect/abstractLocator";
import { ProjectNode } from "./nodes";
import { Container } from "../core/container";
import { addParentFolderToDuplicates } from "../utils/path";
import { getGitBranch, getGitWorktreeParents } from "../utils/git";

export class AutodetectProvider implements vscode.TreeDataProvider<ProjectNode> {

    public readonly onDidChangeTreeData: vscode.Event<ProjectNode | void>;

    private projectSource: CustomProjectLocator;
    private internalOnDidChangeTreeData: vscode.EventEmitter<ProjectNode | void> = new vscode.EventEmitter<ProjectNode | void>();
    private worktreeNodes = new Map<string, ProjectNode[]>();

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

                // the worktrees of a repository
                resolve(this.worktreeNodes.get(element.preview.path) ?? []);

            } else {

                // ROOT

                // raw list
                const lll: ProjectNode[] = [];
                this.worktreeNodes.clear();

                // Locators (VSCode/Git/Mercurial/SVN)
                // this.projectSource.initializeCfg(this.projectSource.kind);

                const projectList = this.projectSource.getProjectList();
                if (projectList.length > 0) {
                    projectList.sort((n1, n2) => {
                        if (n1.name.toLowerCase() > n2.name.toLowerCase()) {
                            return 1;
                        }

                        if (n1.name.toLowerCase() < n2.name.toLowerCase()) {
                            return -1;
                        }

                        return 0;
                    });

                    const projectsWithParent = addParentFolderToDuplicates(projectList);
                    const showGitBranch = vscode.workspace.getConfiguration("projectManager").get<string>("git.showBranchName", "never");

                    // Git worktrees are displayed under the repository they belong to
                    const groupWorktrees = this.projectSource.kind === "git"
                        ? vscode.workspace.getConfiguration("projectManager").get<string>("git.groupWorktrees", "expanded")
                        : "never";
                    const worktreeParents = groupWorktrees === "never"
                        ? new Map<string, string>()
                        : getGitWorktreeParents(projectsWithParent.map(project => project.path));
                    const repositoriesWithWorktrees = new Set(worktreeParents.values());
                    const repositoryCollapsibleState = groupWorktrees === "collapsed"
                        ? vscode.TreeItemCollapsibleState.Collapsed
                        : vscode.TreeItemCollapsibleState.Expanded;

                    for (let index = 0; index < projectsWithParent.length; index++) {
                        const dirinfo = projectsWithParent[ index ];

                        let detail = dirinfo.parent;
                        if (showGitBranch === "always" || showGitBranch === "onlyInSideBar") {
                            const gitBranch = getGitBranch(dirinfo.path);
                            if (gitBranch) {
                                if (detail) {
                                    // Has parent folder info (duplicates), combine with branch
                                    detail = `${detail} | ${gitBranch}`;
                                } else {
                                    // No parent folder info, show just the branch
                                    detail = gitBranch;
                                }
                            }
                        }

                        // if a repository is listed more than once, only the first one displays its worktrees
                        const hasWorktrees = repositoriesWithWorktrees.delete(dirinfo.path);
                        const collapsibleState = hasWorktrees
                            ? repositoryCollapsibleState
                            : vscode.TreeItemCollapsibleState.None;

                        const node = new ProjectNode(dirinfo.name, collapsibleState,
                            dirinfo.icon, {
                                name: dirinfo.name,
                                detail: detail,
                                path: dirinfo.path
                            }, {
                                command: "_projectManager.open",
                                title: "",
                                arguments: [ dirinfo.path, dirinfo.name ],
                            });

                        // VS Code keeps the expanded/collapsed state of known nodes, so the `id` changes
                        // along with the setting, to apply the new state to the repositories already displayed
                        if (hasWorktrees) {
                            node.id = `${groupWorktrees}:${dirinfo.path}`;
                        }

                        const repositoryPath = worktreeParents.get(dirinfo.path);
                        if (repositoryPath) {
                            const worktrees = this.worktreeNodes.get(repositoryPath) ?? [];
                            worktrees.push(node);
                            this.worktreeNodes.set(repositoryPath, worktrees);
                        } else {
                            lll.push(node);
                        }
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

        const projectList = this.projectSource.getProjectList();
        if (this.projectSource.displayName === "Git") {
            const hideGitWelcome = Container.context.globalState.get<boolean>("hideGitWelcome", false);
            vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView" + this.projectSource.displayName,
                projectList.length > 0 || !hideGitWelcome);
        } else {
            vscode.commands.executeCommand("setContext", "projectManager.canShowTreeView" + this.projectSource.displayName,
                projectList.length > 0);
        }
        return;
    }

}
