/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode";
import { ProjectStorage } from "../storage/storage";
import { ProjectNode, TagNode } from "./nodes";

// VS Code requires the tree MIME type to use the lowercased view id
const PROJECT_NODES_MIME_TYPE = "application/vnd.code.tree.projectsexplorerfavorites";

export class ProjectTagDragAndDropController implements vscode.TreeDragAndDropController<ProjectNode | TagNode> {

    public readonly dragMimeTypes = [ PROJECT_NODES_MIME_TYPE ];
    public readonly dropMimeTypes = [ PROJECT_NODES_MIME_TYPE ];

    constructor(
        private readonly projectStorage: ProjectStorage,
        private readonly onDidAddTag: () => void
    ) { }

    public handleDrag(source: readonly (ProjectNode | TagNode)[], dataTransfer: vscode.DataTransfer): void {
        const projects = source.filter((node): node is ProjectNode => node instanceof ProjectNode);

        if (projects.length > 0) {
            dataTransfer.set(PROJECT_NODES_MIME_TYPE, new vscode.DataTransferItem(projects));
        }
    }

    public handleDrop(target: ProjectNode | TagNode | undefined, dataTransfer: vscode.DataTransfer): void {
        const tag = this.getTargetTag(target);
        const projects: ProjectNode[] | undefined = dataTransfer.get(PROJECT_NODES_MIME_TYPE)?.value;
        if (!tag || !projects) {
            return;
        }

        let hasChanges = false;
        for (const project of projects) {
            if (this.projectStorage.addTag(project.preview.name, project.preview.path, project.parentTag, tag)) {
                hasChanges = true;
            }
        }

        if (hasChanges) {
            this.projectStorage.save();
            this.onDidAddTag();
        }
    }

    // Dropping on a project counts as dropping on its tag; the no-tag node has an empty label, so it is not a valid target
    private getTargetTag(target: ProjectNode | TagNode | undefined): string | undefined {
        if (target instanceof TagNode) {
            return target.label;
        }
        return target?.parentTag;
    }
}
