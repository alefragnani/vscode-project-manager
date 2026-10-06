/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveProjectFavicon } from "../../utils/favicon";

suite("Project favicon resolution", () => {
    let projectRoot: string;

    setup(async () => {
        projectRoot = await mkdtemp(join(tmpdir(), "project-manager-favicon-"));
    });

    teardown(async () => {
        await rm(projectRoot, { recursive: true, force: true });
    });

    test("finds a favicon in the project root", async () => {
        const faviconPath = join(projectRoot, "favicon.svg");
        await writeFile(faviconPath, "<svg></svg>");

        assert.strictEqual(await resolveProjectFavicon(projectRoot), faviconPath);
    });

    test("uses candidate priority for direct matches", async () => {
        const publicDirectory = join(projectRoot, "public");
        const rootFaviconPath = join(projectRoot, "favicon.png");
        await mkdir(publicDirectory);
        await writeFile(rootFaviconPath, "root");
        await writeFile(join(publicDirectory, "favicon.svg"), "public");

        assert.strictEqual(await resolveProjectFavicon(projectRoot), rootFaviconPath);
    });

    test("resolves an icon referenced from HTML", async () => {
        const assetDirectory = join(projectRoot, "public", "assets");
        const faviconPath = join(assetDirectory, "site-icon.svg");
        await mkdir(assetDirectory, { recursive: true });
        await writeFile(join(projectRoot, "index.html"), '<link href="/assets/site-icon.svg?v=2" rel="icon">');
        await writeFile(faviconPath, "<svg></svg>");

        assert.strictEqual(await resolveProjectFavicon(projectRoot), faviconPath);
    });

    test("resolves an icon referenced from a route object", async () => {
        const routeDirectory = join(projectRoot, "app", "routes");
        const faviconPath = join(projectRoot, "brand.ico");
        await mkdir(routeDirectory, { recursive: true });
        await writeFile(join(routeDirectory, "__root.tsx"), '({ href: "/brand.ico", rel: "shortcut icon" })');
        await writeFile(faviconPath, "icon");

        assert.strictEqual(await resolveProjectFavicon(projectRoot), faviconPath);
    });

    test("ignores icon references outside the project", async () => {
        const routeDirectory = join(projectRoot, "app", "routes");
        await mkdir(routeDirectory, { recursive: true });
        await writeFile(join(routeDirectory, "__root.tsx"), '({ rel: "icon", href: "../../outside.ico" })');

        assert.strictEqual(await resolveProjectFavicon(projectRoot), null);
    });
});
