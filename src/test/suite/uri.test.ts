/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { Uri } from "vscode";
import { isRemotePath, isRemoteUri } from "../../utils/remote";
import { buildProjectUri } from "../../utils/uri";

suite("URI utils", () => {

    test("recognizes Overleaf Workshop URIs as remote paths", () => {
        const rootPath = "overleaf-workshop://www.overleaf.com/My%20Paper?user=user-1&project=project-1";
        const uri = Uri.parse(rootPath);

        assert.strictEqual(isRemotePath(rootPath), true);
        assert.strictEqual(isRemoteUri(uri), true);
    });

    test("builds an Overleaf Workshop project URI without converting it to a file URI", () => {
        const rootPath = "overleaf-workshop://www.overleaf.com/My%20Paper?user=user-1&project=project-1";
        const uri = buildProjectUri(rootPath);

        assert.strictEqual(uri.scheme, "overleaf-workshop");
        assert.strictEqual(uri.authority, "www.overleaf.com");
        assert.strictEqual(uri.path, "/My Paper");
        assert.strictEqual(uri.query, "user=user-1&project=project-1");
    });
});
