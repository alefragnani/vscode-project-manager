/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { VSCodeRepositoryDetector } from "../../autodetect/vscodeRepositoryDetector";

suite("VSCodeRepositoryDetector", () => {
	const detector = new VSCodeRepositoryDetector();

	test("isRepoFile detects .code-workspace files", () => {
		assert.strictEqual(detector.isRepoFile!("/path/to/project.code-workspace"), true);
		assert.strictEqual(detector.isRepoFile!("/path/to/project.CODE-WORKSPACE"), true);
		assert.strictEqual(detector.isRepoFile!("/path/to/project.txt"), false);
	});

	test("getProjectDetails strips .code-workspace extension", () => {
		assert.strictEqual(detector.getProjectInfo("/path/to/project.code-workspace").name, "project");
		assert.strictEqual(detector.getProjectInfo("/path/to/another").name, "another");
	});
});
