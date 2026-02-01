/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import path = require("path");
import * as vscode from "vscode";
import { Container } from "../core/container";
import { ProjectStorage } from "../storage/storage";
import { PathUtils } from "../utils/path";
import { isRemotePath } from "../utils/remote";
import { sortProjects } from "../utils/sorter";
import { parseTagHierarchy, TagHierarchyNode, isChildTag, TAG_SEPARATOR } from "../utils/tagHierarchy";
import { NO_TAGS_DEFINED } from "./constants";
import { NoTagNode, ProjectNode, TagNode } from "./nodes";

interface ProjectInQuickPick {
    label: string;
    description: string;
    profile: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface ProjectInQuickPickList extends Array<ProjectInQuickPick> { }

export class StorageProvider implements vscode.TreeDataProvider<ProjectNode | TagNode> {

    public readonly onDidChangeTreeData: vscode.Event<ProjectNode | TagNode | void>;

    private projectSource: ProjectStorage;
    private internalOnDidChangeTreeData: vscode.EventEmitter<ProjectNode | TagNode | void> = new vscode.EventEmitter<ProjectNode | void>();
    private static readonly TAGS_EXPANSION_STATE_KEY = "projectsExplorerFavorites.tagsExpansionState";
    private cachedTagHierarchy: Map<string, TagHierarchyNode> | null = null;
    private cachedTags: string[] | null = null;

    constructor(projectSource: ProjectStorage) {
        this.projectSource = projectSource;
        this.onDidChangeTreeData = this.internalOnDidChangeTreeData.event;
    }

    private getTagHierarchy(): Map<string, TagHierarchyNode> {
        const currentTags = this.projectSource.getAvailableTags();
        const tagsChanged = !this.cachedTags || 
            currentTags.length !== this.cachedTags.length ||
            currentTags.some((tag, i) => tag !== this.cachedTags![i]);
        
        if (tagsChanged || !this.cachedTagHierarchy) {
            this.cachedTags = [...currentTags];
            this.cachedTagHierarchy = parseTagHierarchy(currentTags);
        }
        return this.cachedTagHierarchy;
    }

    private static getTagExpansionState(): Record<string, boolean> {
        return Container.context.globalState.get<Record<string, boolean>>(StorageProvider.TAGS_EXPANSION_STATE_KEY, {});
    }

    public static async resetTagExpansionState(): Promise<void> {
        await Container.context.globalState.update(StorageProvider.TAGS_EXPANSION_STATE_KEY, {});
    }

    public static getTagCollapsibleState(tagId: string, behavior: string): vscode.TreeItemCollapsibleState {
        switch (behavior) {
            case "alwaysExpanded":
                return vscode.TreeItemCollapsibleState.Expanded;
            case "alwaysCollapsed":
                return vscode.TreeItemCollapsibleState.Collapsed;
            case "startExpanded":
            case "startCollapsed": {
                const expansionState = StorageProvider.getTagExpansionState();
                const isExpanded = expansionState[ tagId ];
                if (isExpanded === undefined) {
                    return behavior === "startExpanded" ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
                }
                return isExpanded ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed;
            }
            default:
                return vscode.TreeItemCollapsibleState.Expanded;
        }
    }

    public static async setTagExpanded(tagId: string, expanded: boolean): Promise<void> {
        const expansionState = StorageProvider.getTagExpansionState();
        const newExpansionState = { ...expansionState, [ tagId ]: expanded };
        await Container.context.globalState.update(StorageProvider.TAGS_EXPANSION_STATE_KEY, newExpansionState);
    }

    public refresh(): void {
        this.internalOnDidChangeTreeData.fire();
    }

    public getTreeItem(element: ProjectNode | TagNode): vscode.TreeItem {
        return element;
    }

    public getChildren(element?: ProjectNode | TagNode): Thenable<ProjectNode[] | TagNode[]> {

        // loop !!!
        return new Promise(resolve => {

            if (element instanceof TagNode) {
                const tagFullPath = element.getTagId();
                const isNoTagNode = element instanceof NoTagNode;

                if (isNoTagNode) {
                    const projectNodes: ProjectNode[] = [];
                    let projectsMapped = <ProjectInQuickPickList>this.projectSource.getProjectsByTag('');
                    projectsMapped = sortProjects(projectsMapped);

                    for (const prj of projectsMapped) {
                        let iconFavorites = "favorites";
                        if (path.extname(prj.description) === ".code-workspace") {
                            iconFavorites = "favorites-workspace";
                        } else if (isRemotePath(prj.description)) {
                            iconFavorites = "favorites-remote";
                        }
                        projectNodes.push(new ProjectNode(prj.label, vscode.TreeItemCollapsibleState.None,
                            iconFavorites, {
                                name: prj.label,
                                path: PathUtils.expandHomePath(prj.description)
                            }, {
                                command: "_projectManager.open",
                                title: "",
                                arguments: [ PathUtils.expandHomePath(prj.description), prj.label, (prj as any).profile ],
                            }));
                    }
                    resolve(projectNodes);
                    return;
                }

                const tagsCollapseBehavior = vscode.workspace.getConfiguration("projectManager").get<string>("tags.collapseItems", "startExpanded");
                const tagHierarchy = this.getTagHierarchy();

                const childTagNodes: TagNode[] = [];
                const childTags = this.getChildTagsAtLevel(tagHierarchy, tagFullPath);
                for (const childTag of childTags) {
                    const hasGrandchildren = this.hasChildTags(tagHierarchy, childTag.fullPath);
                    const hasDirectProjects = this.projectSource.getProjectsByTagExact(childTag.fullPath).length > 0;
                    const collapsibleState = (hasGrandchildren || hasDirectProjects)
                        ? StorageProvider.getTagCollapsibleState(childTag.fullPath, tagsCollapseBehavior)
                        : vscode.TreeItemCollapsibleState.None;
                    childTagNodes.push(new TagNode(childTag.name, collapsibleState, childTag.fullPath, tagFullPath));
                }

                const projectNodes: ProjectNode[] = [];
                let projectsMapped = <ProjectInQuickPickList>this.projectSource.getProjectsByTagExact(tagFullPath);
                projectsMapped = sortProjects(projectsMapped);

                for (const prj of projectsMapped) {
                    let iconFavorites = "favorites";
                    if (path.extname(prj.description) === ".code-workspace") {
                        iconFavorites = "favorites-workspace";
                    } else if (isRemotePath(prj.description)) {
                        iconFavorites = "favorites-remote";
                    }
                    projectNodes.push(new ProjectNode(prj.label, vscode.TreeItemCollapsibleState.None,
                        iconFavorites, {
                            name: prj.label,
                            path: PathUtils.expandHomePath(prj.description)
                        }, {
                            command: "_projectManager.open",
                            title: "",
                            arguments: [ PathUtils.expandHomePath(prj.description), prj.label, prj.profile ],
                        }));
                }

                resolve([ ...childTagNodes, ...projectNodes ] as TagNode[] | ProjectNode[]);

            } else if (element) {
                resolve([]);

            } else { // ROOT

                // no project saved yet, returns [] `empty`...
                if (this.projectSource.length() === 0) {
                    return resolve([]);
                }

                // choose the view
                const viewAsList = Container.context.globalState.get<boolean>("viewAsList", true);

                // viewAsTags - must have at least one tag otherwise, use `viewAsList`
                if (!viewAsList) {
                    const tagsCollapseBehavior = vscode.workspace.getConfiguration("projectManager").get<string>("tags.collapseItems", "startExpanded");
                    const tagHierarchy = this.getTagHierarchy();

                    let nodes: TagNode[] = [];
                    for (const [ name, node ] of tagHierarchy) {
                        const hasChildren = node.children.size > 0;
                        const hasDirectProjects = this.projectSource.getProjectsByTagExact(node.fullPath).length > 0;
                        const collapsibleState = (hasChildren || hasDirectProjects)
                            ? StorageProvider.getTagCollapsibleState(node.fullPath, tagsCollapseBehavior)
                            : vscode.TreeItemCollapsibleState.None;
                        nodes.push(new TagNode(name, collapsibleState, node.fullPath));
                    }

                    if (this.projectSource.getProjectsByTag('').length !== 0) {
                        nodes.push(new NoTagNode(NO_TAGS_DEFINED, StorageProvider.getTagCollapsibleState(NO_TAGS_DEFINED, tagsCollapseBehavior)));
                    }

                    if (nodes.length > 0) {
                        const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
                        if (filterByTags.length > 0) {
                            nodes = nodes.filter(node => {
                                const nodeFullPath = node.getTagId();
                                return filterByTags.some(filterTag => 
                                    nodeFullPath === filterTag || 
                                    isChildTag(filterTag, nodeFullPath) ||
                                    isChildTag(nodeFullPath, filterTag)
                                ) || (filterByTags.includes(NO_TAGS_DEFINED) && node.label === "");
                            });
                        }

                        resolve(nodes);
                        return;
                    }
                }

                // viewAsList OR no Tags
                // raw list
                const nodes: ProjectNode[] = [];

                let projectsMapped: ProjectInQuickPickList;

                const filterByTags = Container.context.globalState.get<string[]>("filterByTags", []);
                if (filterByTags.length > 0) {
                    projectsMapped = <ProjectInQuickPickList>this.projectSource.getProjectsByTags(filterByTags);
                } else {
                    projectsMapped = <ProjectInQuickPickList>this.projectSource.map();
                }

                projectsMapped = sortProjects(projectsMapped);

                for (let index = 0; index < projectsMapped.length; index++) {
                    const prj: ProjectInQuickPick = projectsMapped[ index ];

                    let iconFavorites = "favorites";
                    if (path.extname(prj.description) === ".code-workspace") {
                        iconFavorites = "favorites-workspace";
                    } else if (isRemotePath(prj.description)) {
                        iconFavorites = "favorites-remote";
                    }
                    nodes.push(new ProjectNode(prj.label, vscode.TreeItemCollapsibleState.None,
                        iconFavorites, {
                            name: prj.label,
                            path: PathUtils.expandHomePath(prj.description)
                        },
                        {
                            command: "_projectManager.open",
                            title: "",
                            arguments: [ PathUtils.expandHomePath(prj.description), prj.label, prj.profile ],
                        }));
                }

                resolve(nodes);
            }
        });
    }

    private getChildTagsAtLevel(hierarchy: Map<string, TagHierarchyNode>, parentPath: string): TagHierarchyNode[] {
        const parts = parentPath.split(TAG_SEPARATOR);
        let current = hierarchy;

        for (const part of parts) {
            const node = current.get(part);
            if (!node) {
                return [];
            }
            current = node.children;
        }

        return Array.from(current.values());
    }

    private hasChildTags(hierarchy: Map<string, TagHierarchyNode>, tagPath: string): boolean {
        const children = this.getChildTagsAtLevel(hierarchy, tagPath);
        return children.length > 0;
    }

}
