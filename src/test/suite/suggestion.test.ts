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

        // VS Code's Uri.toString percent-encodes '+' in authority as '%2B'
        // (RFC 3986 reserves '+' for userinfo; both forms parse back to the
        // same authority). The path component must be unchanged.
        assert.ok(encoded.startsWith("vscode-remote://"),
            `expected vscode-remote scheme; got ${encoded}`);
        assert.ok(encoded.endsWith("/home/user/projects/myapp"),
            `expected path preserved verbatim; got ${encoded}`);

        // Round-trip: Uri.parse(encoded).authority decodes back to "wsl+ubuntu"
        const roundTripped = Uri.parse(encoded);
        assert.strictEqual(roundTripped.authority, "wsl+ubuntu");
        assert.strictEqual(roundTripped.path, "/home/user/projects/myapp");
    });

    test("buildCodespacesProjectPath preserves the local path verbatim", () => {
        // Codespaces branch: localUri is a file: Uri whose .path is decoded.
        // The resulting vscode-remote://codespaces+NAME/... string must
        // preserve the local path verbatim and round-trip cleanly.
        const localUri = Uri.file("/workspaces/repo/Csharp");
        const encoded = buildCodespacesProjectPath(localUri, "happy-codespace-name");

        // Uri.toString percent-encodes '+' in authority as '%2B'; the path
        // component must be preserved verbatim.
        assert.ok(encoded.startsWith("vscode-remote://"),
            `expected vscode-remote scheme; got ${encoded}`);
        assert.ok(encoded.endsWith("/workspaces/repo/Csharp"),
            `expected local path preserved verbatim; got ${encoded}`);

        // Round-trip: authority decodes back to "codespaces+happy-codespace-name"
        const roundTripped = Uri.parse(encoded);
        assert.strictEqual(roundTripped.authority, "codespaces+happy-codespace-name");
        assert.strictEqual(roundTripped.path, "/workspaces/repo/Csharp");
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
