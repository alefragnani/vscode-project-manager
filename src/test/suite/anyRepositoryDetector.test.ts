/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import os = require("os");
import * as assert from "assert";
import { AnyRepositoryDetector } from "../../autodetect/anyRepositoryDetector";

suite("AnyRepositoryDetector", () => {
    const detector = new AnyRepositoryDetector([]);

    test("isRepoDir returns true for any existing directory", () => {
        const testDir = fs.mkdtempSync(path.join(os.tmpdir(), "any-repo-detector-test-"));

        try {
            assert.strictEqual(detector.isRepoDir(testDir), true);
        } finally {
            if (fs.existsSync(testDir)) {
                fs.rmSync(testDir, { recursive: true, force: true });
            }
        }
    });

    test("isRepoDir returns false for non-existing directory", () => {
        const nonExistentDir = path.join(os.tmpdir(), "non-existent-dir-" + Date.now());
        assert.strictEqual(detector.isRepoDir(nonExistentDir), false);
    });

    test("getProjectInfo returns correct name from path", () => {
        const projectInfo = detector.getProjectInfo("/path/to/my-project");
        assert.strictEqual(projectInfo.name, "my-project");
    });

    test("getProjectInfo returns correct fullPath", () => {
        const testPath = "/path/to/test-project";
        const projectInfo = detector.getProjectInfo(testPath);
        assert.strictEqual(projectInfo.fullPath, testPath);
    });

    test("getProjectInfo returns correct icon", () => {
        const projectInfo = detector.getProjectInfo("/path/to/project");
        assert.strictEqual(projectInfo.icon, "$(file-directory)");
    });

    test("getProjectInfo with nested path returns correct name", () => {
        const projectInfo = detector.getProjectInfo("/very/deep/nested/project-folder");
        assert.strictEqual(projectInfo.name, "project-folder");
    });
});
