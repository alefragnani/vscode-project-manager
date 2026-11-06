/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import * as os from "os";
import * as path from "path";
import fs = require("fs");
import * as vscode from "vscode";
import { Container } from "../../core/container";
import { NoTagNode, ProjectNode, TagNode } from "../../sidebar/nodes";
import { ProjectTagDragAndDropController } from "../../sidebar/projectTagDragAndDrop";
import { StorageProvider } from "../../sidebar/storageProvider";
import { ProjectStorage } from "../../storage/storage";
import { createMockContext } from "./mocks/MockMemento";

suite("ProjectTagDragAndDropController", () => {

    const projectPath = path.join(os.tmpdir(), "drag-project");
    let filename: string;
    let storage: ProjectStorage;
    let refreshCount: number;
    let controller: ProjectTagDragAndDropController;

    function projectNode(parentTag?: string): ProjectNode {
        return new ProjectNode("Project", vscode.TreeItemCollapsibleState.None, undefined,
            { name: "Project", path: projectPath }, undefined, parentTag);
    }

    function tagNode(tag: string): TagNode {
        return new TagNode(tag, vscode.TreeItemCollapsibleState.Expanded);
    }

    function drag(...source: (ProjectNode | TagNode)[]): vscode.DataTransfer {
        const dataTransfer = new vscode.DataTransfer();
        controller.handleDrag(source, dataTransfer);
        return dataTransfer;
    }

    function savedTags(): string[] {
        return JSON.parse(fs.readFileSync(filename).toString())[ 0 ].tags;
    }

    setup(() => {
        filename = path.join(os.tmpdir(), `project-manager-dnd-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
        storage = new ProjectStorage(filename);
        storage.push("Project", projectPath, [ "existing" ]);
        storage.save();
        refreshCount = 0;
        controller = new ProjectTagDragAndDropController(storage, () => refreshCount++);
    });

    teardown(() => {
        fs.rmSync(filename, { force: true });
    });

    test("dropping on a tag adds it, keeps other tags, saves and refreshes", () => {
        controller.handleDrop(tagNode("Work"), drag(projectNode()));

        assert.deepStrictEqual(savedTags(), [ "existing", "Work" ]);
        assert.strictEqual(refreshCount, 1);
    });

    test("dropping on a project inside a tag adds its parent tag", () => {
        controller.handleDrop(projectNode("Work"), drag(projectNode()));

        assert.deepStrictEqual(savedTags(), [ "existing", "Work" ]);
    });

    test("dropping on a tag the project already has changes nothing", () => {
        controller.handleDrop(tagNode("existing"), drag(projectNode()));

        assert.deepStrictEqual(savedTags(), [ "existing" ]);
        assert.strictEqual(refreshCount, 0);
    });

    test("dropping on invalid targets changes nothing", () => {
        const noTag = new NoTagNode("no tags", vscode.TreeItemCollapsibleState.Expanded);

        for (const target of [ noTag, projectNode(), projectNode(""), undefined ]) {
            controller.handleDrop(target, drag(projectNode()));
        }

        assert.deepStrictEqual(savedTags(), [ "existing" ]);
        assert.strictEqual(refreshCount, 0);
    });

    test("projects sharing a path get the tag on the dragged project only", () => {
        storage.push("Same Path", projectPath, []);
        storage.save();
        const node = new ProjectNode("Same Path", vscode.TreeItemCollapsibleState.None, undefined,
            { name: "Same Path", path: projectPath }, undefined, "");

        controller.handleDrop(tagNode("Work"), drag(node));

        assert.deepStrictEqual(storage.getProjects().map(project => project.tags), [ [ "existing" ], [ "Work" ] ]);
    });

    test("identical duplicates are told apart by the tag they were dragged from", () => {
        storage.push("Project", projectPath, [ "other" ]);
        storage.save();

        controller.handleDrop(tagNode("Work"), drag(projectNode("other")));

        assert.deepStrictEqual(storage.getProjects().map(project => project.tags), [ [ "existing" ], [ "other", "Work" ] ]);
    });

    test("dragging a tag does not start a project transfer", () => {
        controller.handleDrop(tagNode("Work"), drag(tagNode("existing")));

        assert.deepStrictEqual(savedTags(), [ "existing" ]);
        assert.strictEqual(refreshCount, 0);
    });
});

suite("StorageProvider drop targets", () => {

    const configuredTag = "configured-only-tag";
    let provider: StorageProvider;

    suiteSetup(async () => {
        const context = { ...createMockContext(), extensionUri: vscode.Uri.file(os.tmpdir()) } as vscode.ExtensionContext;
        await context.globalState.update("viewAsList", false);
        Container.initialize(context);
        await vscode.workspace.getConfiguration("projectManager").update("tags", [ configuredTag ], vscode.ConfigurationTarget.Global);

        const storage = new ProjectStorage(path.join(os.tmpdir(), "project-manager-unused.json"));
        storage.push("Tagged", path.join(os.tmpdir(), "tagged"), [ "used-tag" ]);
        storage.push("Untagged", path.join(os.tmpdir(), "untagged"));
        provider = new StorageProvider(storage);
    });

    suiteTeardown(async () => {
        await vscode.workspace.getConfiguration("projectManager").update("tags", undefined, vscode.ConfigurationTarget.Global);
    });

    test("root lists used and configured tags, followed by the no-tag node", async () => {
        const nodes = await provider.getChildren() as TagNode[];

        assert.deepStrictEqual(nodes.map(node => node.label), [ configuredTag, "used-tag", "" ]);
        assert.ok(nodes[ 2 ] instanceof NoTagNode);
    });

    test("project nodes know the tag they are listed under", async () => {
        const nodes = await provider.getChildren(new TagNode("used-tag", vscode.TreeItemCollapsibleState.Expanded)) as ProjectNode[];

        assert.deepStrictEqual(nodes.map(node => [ node.label, node.parentTag ]), [ [ "Tagged", "used-tag" ] ]);
    });
});
