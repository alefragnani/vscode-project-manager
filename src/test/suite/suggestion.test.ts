/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { Uri } from "vscode";
import { buildRemoteProjectPath, buildCodespacesProjectPath } from "../../utils/suggestion";

suite("Suggestion utils", () => {

    test("buildRemoteProjectPath percent-encodes # in wsl+ubuntu path (issue #846)", () => {
        // Reproduce issue #846: a WSL project at `/home/user/tmp/C#/` must
        // survive the save -> reload round-trip. The raw `#` would otherwise
        // be reinterpreted as a URI fragment delimiter by Uri.parse in
        // buildProjectUri, truncating the path to `/home/user/tmp/C`.
        const uri = Uri.parse("vscode-remote://wsl+ubuntu/home/user/tmp/C%23/");
        const encoded = buildRemoteProjectPath(uri);

        assert.strictEqual(encoded, "vscode-remote://wsl+ubuntu/home/user/tmp/C%23/");
        assert.ok(!encoded.includes("C#/"),
            `encoded form must not contain a raw '#' in the path; got ${encoded}`);

        // Round-trip: parsing the encoded form must yield the original fsPath.
        const roundTripped = Uri.parse(encoded);
        assert.strictEqual(roundTripped.fsPath, "/home/user/tmp/C#/");
    });

    test("buildRemoteProjectPath preserves vscode-vfs (Live Share / github.dev) path with #", () => {
        const uri = Uri.from({
            scheme: "vscode-vfs",
            authority: "github%2Buser%2Frepo",
            path: "/workspaces/repo/folder#/sub"
        });
        const encoded = buildRemoteProjectPath(uri);

        assert.ok(encoded.includes("folder%23"),
            `expected 'folder%23' in encoded form, got ${encoded}`);
        assert.ok(!encoded.includes("folder#"),
            `encoded form must not contain raw '#'; got ${encoded}`);
    });

    test("buildRemoteProjectPath encodes ? and % in addition to #", () => {
        // Other URI-reserved characters that the previous template-concat
        // form would silently drop or misroute.
        const uri = Uri.from({
            scheme: "vscode-remote",
            authority: "wsl+ubuntu",
            path: "/home/user/q?/100%/done"
        });
        const encoded = buildRemoteProjectPath(uri);

        assert.ok(encoded.includes("q%3F"), `expected 'q%3F' in encoded form; got ${encoded}`);
        assert.ok(encoded.includes("100%25"), `expected '100%25' in encoded form; got ${encoded}`);
    });

    test("buildCodespacesProjectPath percent-encodes the local path segment", () => {
        // Codespaces branch: localUri is a file: Uri whose .path is decoded.
        // The resulting vscode-remote://codespaces+NAME/... string must have
        // the local path percent-encoded.
        const localUri = Uri.file("/workspaces/repo/C#");
        const encoded = buildCodespacesProjectPath(localUri, "happy-codespace-name");

        assert.strictEqual(
            encoded,
            "vscode-remote://codespaces+happy-codespace-name/workspaces/repo/C%23"
        );
        assert.ok(!encoded.includes("C#"),
            `encoded form must not contain raw '#'; got ${encoded}`);

        // Round-trip via Uri.parse recovers the original path.
        const roundTripped = Uri.parse(encoded);
        assert.strictEqual(roundTripped.path, "/workspaces/repo/C#");
    });

    test("buildRemoteProjectPath leaves normal paths without reserved characters unchanged", () => {
        const uri = Uri.parse("vscode-remote://wsl+ubuntu/home/user/projects/myapp");
        const encoded = buildRemoteProjectPath(uri);

        assert.strictEqual(encoded, "vscode-remote://wsl+ubuntu/home/user/projects/myapp");
    });
});
