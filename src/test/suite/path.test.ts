/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import * as path from "path";
import { getLinuxConfigFilePath } from "../../utils/path";

suite("PathUtils", () => {
    test("uses XDG_CONFIG_HOME for Linux project files when configured", () => {
        const result = getLinuxConfigFilePath("projects.json", "Code", "/home/tester", "/tmp/xdg-config");

        assert.strictEqual(result, path.join("/tmp/xdg-config", "Code", "User", "projects.json"));
    });

    test("falls back to the user's .config directory", () => {
        const result = getLinuxConfigFilePath("projects.json", "Code", "/home/tester");

        assert.strictEqual(result, path.join("/home/tester", ".config", "Code", "User", "projects.json"));
    });
});
