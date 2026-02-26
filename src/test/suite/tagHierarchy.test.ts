/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import {
    parseTagHierarchy,
    getParentTag,
    isChildTag,
    tagMatchesFilter,
    TAG_SEPARATOR
} from "../../utils/tagHierarchy";

suite("Tag Hierarchy Tests", () => {

    suite("parseTagHierarchy", () => {
        test("should parse flat tags", () => {
            const tags = ["Work", "Personal", "TypeScript"];
            const hierarchy = parseTagHierarchy(tags);

            assert.strictEqual(hierarchy.size, 3);
            assert.ok(hierarchy.has("Work"));
            assert.ok(hierarchy.has("Personal"));
            assert.ok(hierarchy.has("TypeScript"));
        });

        test("should parse hierarchical tags", () => {
            const tags = ["Work::Completed", "Work::InProgress"];
            const hierarchy = parseTagHierarchy(tags);

            assert.strictEqual(hierarchy.size, 1);
            assert.ok(hierarchy.has("Work"));

            const workNode = hierarchy.get("Work")!;
            assert.strictEqual(workNode.children.size, 2);
            assert.ok(workNode.children.has("Completed"));
            assert.ok(workNode.children.has("InProgress"));
        });

        test("should parse deeply nested tags", () => {
            const tags = ["Work::InProgress::Frontend"];
            const hierarchy = parseTagHierarchy(tags);

            const workNode = hierarchy.get("Work")!;
            assert.strictEqual(workNode.fullPath, "Work");

            const inProgressNode = workNode.children.get("InProgress")!;
            assert.strictEqual(inProgressNode.fullPath, "Work::InProgress");

            const frontendNode = inProgressNode.children.get("Frontend")!;
            assert.strictEqual(frontendNode.fullPath, "Work::InProgress::Frontend");
        });

        test("should handle mixed flat and hierarchical tags", () => {
            const tags = ["Work::Completed", "Personal", "Work::InProgress::Frontend"];
            const hierarchy = parseTagHierarchy(tags);

            assert.strictEqual(hierarchy.size, 2);
            assert.ok(hierarchy.has("Work"));
            assert.ok(hierarchy.has("Personal"));

            const personalNode = hierarchy.get("Personal")!;
            assert.strictEqual(personalNode.children.size, 0);
        });

        test("should handle empty array", () => {
            const hierarchy = parseTagHierarchy([]);
            assert.strictEqual(hierarchy.size, 0);
        });
    });

    suite("getParentTag", () => {
        test("should return undefined for flat tag", () => {
            assert.strictEqual(getParentTag("Work"), undefined);
        });

        test("should return parent for nested tag", () => {
            assert.strictEqual(getParentTag("Work::Completed"), "Work");
        });

        test("should return immediate parent for deeply nested tag", () => {
            assert.strictEqual(getParentTag("Work::InProgress::Frontend"), "Work::InProgress");
        });
    });

    suite("isChildTag", () => {
        test("should return false for same tag", () => {
            assert.strictEqual(isChildTag("Work", "Work"), false);
        });

        test("should return true for direct child", () => {
            assert.strictEqual(isChildTag("Work", "Work::Completed"), true);
        });

        test("should return true for deeply nested child", () => {
            assert.strictEqual(isChildTag("Work", "Work::InProgress::Frontend"), true);
        });

        test("should return false for unrelated tags", () => {
            assert.strictEqual(isChildTag("Work", "Personal"), false);
        });

        test("should return false for partial match", () => {
            assert.strictEqual(isChildTag("Work", "WorkCompleted"), false);
        });
    });

    suite("tagMatchesFilter", () => {
        test("should match exact tag", () => {
            assert.strictEqual(tagMatchesFilter("Work", "Work"), true);
        });

        test("should match child tag when filtering by parent", () => {
            assert.strictEqual(tagMatchesFilter("Work::Completed", "Work"), true);
        });

        test("should match deeply nested child", () => {
            assert.strictEqual(tagMatchesFilter("Work::InProgress::Frontend", "Work"), true);
        });

        test("should not match parent when filtering by child", () => {
            assert.strictEqual(tagMatchesFilter("Work", "Work::Completed"), false);
        });

        test("should not match unrelated tags", () => {
            assert.strictEqual(tagMatchesFilter("Personal", "Work"), false);
        });
    });

    suite("TAG_SEPARATOR constant", () => {
        test("should be '::'", () => {
            assert.strictEqual(TAG_SEPARATOR, "::");
        });
    });
});
