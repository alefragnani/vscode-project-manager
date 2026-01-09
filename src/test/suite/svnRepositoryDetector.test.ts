/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import os = require("os");
import * as assert from "assert";
import { SvnRepositoryDetector } from "../../autodetect/svnRepositoryDetector";

suite("SvnRepositoryDetector", () => {
    const detector = new SvnRepositoryDetector([ ".svn", "pristine" ]);

    test("isRepoDir detects .svn/pristine directories", () => {
        const regularDir = fs.mkdtempSync(path.join(os.tmpdir(), "svn-repo-detector-test-regular-"));
        const svnDir = fs.mkdtempSync(path.join(os.tmpdir(), "svn-repo-detector-test-svn-"));

        try {
            const svnSubDir = path.join(svnDir, ".svn");
            fs.mkdirSync(svnSubDir);
            fs.mkdirSync(path.join(svnSubDir, "pristine"));

            assert.strictEqual(detector.isRepoDir(regularDir), false);
            assert.strictEqual(detector.isRepoDir(svnDir), true);
        } finally {
            if (fs.existsSync(svnDir)) {
                fs.rmSync(svnDir, { recursive: true, force: true });
            }
            if (fs.existsSync(regularDir)) {
                fs.rmSync(regularDir, { recursive: true, force: true });
            }
        }
    });

    test("getProjectInfo returns correct project name", () => {
        assert.strictEqual(detector.getProjectInfo("/path/to/project").name, "project");
        assert.strictEqual(detector.getProjectInfo("/path/to/another").name, "another");
    });

    test("getProjectInfo returns correct fullPath", () => {
        const projectPath = "/path/to/project";
        const projectInfo = detector.getProjectInfo(projectPath);
        assert.strictEqual(projectInfo.fullPath, projectPath);
    });

    test("getProjectInfo returns correct icon", () => {
        const projectInfo = detector.getProjectInfo("/path/to/project");
        assert.strictEqual(projectInfo.icon, "$(symbol-event)");
        //TODO: Update my vscode-ext-codicons library with the latest version os VS Code since $(zap) was replaced by `$(symbol-event)`
    });
});
