/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { Uri } from "vscode";
import { buildRemoteProjectPath, buildCodespacesProjectPath } from "../../utils/suggestion";

suite("Suggestion utils", () => {

    test("buildRemoteProjectPath percent-encodes # in a wsl+ubuntu path (issue #846)", () => {
        // Reproduces issue #846: a WSL project at `/home/user/tmp/C#/` must
        // survive the save -> reload round-trip. Before the fix, the raw '#'
        // was reinterpreted as a URI fragment delimiter by Uri.parse in
        // buildProjectUri, truncating the path to `/home/user/tmp/C`.
        const uri = Uri.from({
            scheme: "vscode-remote",
            authority: "wsl+ubuntu",
            path: "/home/user/tmp/C#/"
        });
        const encoded = buildRemoteProjectPath(uri);

        // The encoded form must not contain a raw '#' in the path component,
        // otherwise Uri.parse would later split it into path + fragment.
        assert.ok(!encoded.includes("C#/"),
            `encoded form must not contain raw '#' in path; got ${encoded}`);
        assert.ok(encoded.includes("C"),
            `encoded form must still contain 'C' segment; got ${encoded}`);

        // Round-trip: parsing the encoded form must yield a Uri whose fsPath
        // still ends with C#/ (the original path is preserved).
        const roundTripped = Uri.parse(encoded);
        assert.ok(roundTripped.fsPath.endsWith("C#/"),
            `round-tripped fsPath must end with 'C#/'; got ${roundTripped.fsPath}`);
    });

    test("buildRemoteProjectPath preserves a normal path without reserved characters", () => {
        const uri = Uri.from({
            scheme: "vscode-remote",
            authority: "wsl+ubuntu",
            path: "/home/user/projects/myapp"
        });
        const encoded = buildRemoteProjectPath(uri);

        assert.strictEqual(
            encoded,
            "vscode-remote://wsl+ubuntu/home/user/projects/myapp"
        );
    });

    test("buildCodespacesProjectPath percent-encodes the local path segment", () => {
        // Codespaces branch: localUri is a file: Uri whose .path is decoded.
        // The resulting vscode-remote://codespaces+NAME/... string must not
        // contain a raw '#' in the path.
        const localUri = Uri.file("/workspaces/repo/Csharp");
        const encoded = buildCodespacesProjectPath(localUri, "happy-codespace-name");

        assert.strictEqual(
            encoded,
            "vscode-remote://codespaces+happy-codespace-name/workspaces/repo/Csharp"
        );
    });

    test("buildCodespacesProjectPath encodes # when the local path contains it", () => {
        const localUri = Uri.file("/workspaces/repo/C#");
        const encoded = buildCodespacesProjectPath(localUri, "happy-codespace-name");

        assert.ok(!encoded.includes("C#"),
            `encoded form must not contain raw '#' in path; got ${encoded}`);

        // Round-trip via Uri.parse recovers the original decoded path.
        const roundTripped = Uri.parse(encoded);
        assert.ok(roundTripped.path.endsWith("C#"),
            `round-tripped path must end with 'C#'; got ${roundTripped.path}`);
    });
});
