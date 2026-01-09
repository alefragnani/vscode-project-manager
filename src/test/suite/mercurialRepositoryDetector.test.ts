/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import fs = require("fs");
import path = require("path");
import os = require("os");
import * as assert from "assert";
import { MercurialRepositoryDetector } from "../../autodetect/mercurialRepositoryDetector";
import { codicons } from "vscode-ext-codicons";

suite("MercurialRepositoryDetector", () => {
    const detector = new MercurialRepositoryDetector([ ".hg" ]);

    test("isRepoDir detects .hg directories", () => {
        const regularDir = fs.mkdtempSync(path.join(os.tmpdir(), "mercurial-repo-detector-test-regular-"));
        const mercurialDir = fs.mkdtempSync(path.join(os.tmpdir(), "mercurial-repo-detector-test-hg-"));

        try {
            fs.mkdirSync(path.join(mercurialDir, ".hg"));

            assert.strictEqual(detector.isRepoDir(regularDir), false);
            assert.strictEqual(detector.isRepoDir(mercurialDir), true);
        } finally {
            if (fs.existsSync(mercurialDir)) {
                fs.rmSync(mercurialDir, { recursive: true, force: true });
            }
            if (fs.existsSync(regularDir)) {
                fs.rmSync(regularDir, { recursive: true, force: true });
            }
        }
    });

    test("getProjectInfo returns correct name", () => {
        assert.strictEqual(detector.getProjectInfo("/path/to/project").name, "project");
        assert.strictEqual(detector.getProjectInfo("/path/to/another").name, "another");
    });

    test("getProjectInfo returns correct icon", () => {
        const project = detector.getProjectInfo("/path/to/project");

        assert.strictEqual(project.icon, codicons.git_branch);
    });
});
