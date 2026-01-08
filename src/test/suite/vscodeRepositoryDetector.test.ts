/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import os = require("os");
import * as assert from "assert";
import { VSCodeRepositoryDetector } from "../../autodetect/vscodeRepositoryDetector";

suite("VSCodeRepositoryDetector", () => {
	const detector = new VSCodeRepositoryDetector();

	test("isRepoFile detects .code-workspace files", () => {
		assert.strictEqual(detector.isRepoFile("/path/to/project.code-workspace"), true);
		assert.strictEqual(detector.isRepoFile("/path/to/PROJECT_UPPERCASE.code-workspace"), true);
		assert.strictEqual(detector.isRepoFile("/path/to/not-a-project.txt"), false);
	});

    test("isRepoDir detects .vscode directories", () => {
        const regularDir = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-repo-detector-test-regular-"));
        const vscodeDir = fs.mkdtempSync(path.join(os.tmpdir(), "vscode-repo-detector-test-vscode-"));

        // fs.mkdirSync(regularDir);
        fs.mkdirSync(path.join(vscodeDir, ".vscode"));

        assert.strictEqual(detector.isRepoDir(regularDir), false);
        assert.strictEqual(detector.isRepoDir(vscodeDir), true);

        // Cleanup
        fs.rmSync(vscodeDir, { recursive: true, force: true });
        fs.rmSync(regularDir, { recursive: true });
    });
    
	test("getProjectInfo strips .code-workspace extension", () => {
		assert.strictEqual(detector.getProjectInfo("/path/to/project.code-workspace").name, "project");
		assert.strictEqual(detector.getProjectInfo("/path/to/another").name, "another");
	});

    test("getProjectInfo returns correct icon", () => {
        const workspaceProject = detector.getProjectInfo("/path/to/project.code-workspace");
        const folderProject = detector.getProjectInfo("/path/to/another");

        assert.strictEqual(workspaceProject.icon, "$(root-folder)");
        assert.strictEqual(folderProject.icon, "$(file-code)");
    });
});
