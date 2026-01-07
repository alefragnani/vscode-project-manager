/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from "assert";
import * as vscode from "vscode";
import { StorageProvider } from "../../sidebar/storageProvider";
import { Container } from '../../../src/core/container';
import { createMockContext } from "./mocks/MockMemento";

suite("StorageProvider Tag Expansion Tests", () => {

    let context: vscode.ExtensionContext;

    suiteSetup(async () => {
        // Ensure the `Container.context` is initialized before tests
        context = createMockContext();
        Container.initialize(context);
    });


    teardown(async () => {
        // Reset the tag expansion state after each test
        await StorageProvider.resetTagExpansionState();
    });

    suite("getTagCollapsibleState", () => {
        test("should return Expanded for alwaysExpanded behavior", () => {
            const state = StorageProvider.getTagCollapsibleState("tag1", "alwaysExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
        });

        test("should return Collapsed for alwaysCollapsed behavior", () => {
            const state = StorageProvider.getTagCollapsibleState("tag1", "alwaysCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test("should return Expanded for startExpanded behavior with no saved state", async () => {
            const state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
        });

        test("should return Collapsed for startCollapsed behavior with no saved state", () => {
            const state = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test("should return Expanded for startExpanded behavior when state is saved as expanded", async () => {
            // Set tag as expanded
            await StorageProvider.setTagExpanded("tag1", true);
            
            const state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
        });

        test("should return Collapsed for startExpanded behavior when state is saved as collapsed", async () => {
            // Set tag as collapsed
            await StorageProvider.setTagExpanded("tag1", false);
            
            const state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test("should return Expanded for startCollapsed behavior when state is saved as expanded", async () => {
            // Set tag as expanded
            await StorageProvider.setTagExpanded("tag1", true);
            
            const state = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
        });

        test("should return Collapsed for startCollapsed behavior when state is saved as collapsed", async () => {
            // Set tag as collapsed
            await StorageProvider.setTagExpanded("tag1", false);
            
            const state = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test("should return Expanded as default for empty string behavior", () => {
            const state = StorageProvider.getTagCollapsibleState("tag1", "");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
        });

        test("should respect saved state for different tags independently", async () => {
            // Set different states for different tags
            await StorageProvider.setTagExpanded("tag1", true);
            await StorageProvider.setTagExpanded("tag2", false);
            await StorageProvider.setTagExpanded("tag3", true);
            
            const state1 = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            const state2 = StorageProvider.getTagCollapsibleState("tag2", "startExpanded");
            const state3 = StorageProvider.getTagCollapsibleState("tag3", "startExpanded");
            
            assert.strictEqual(state1, vscode.TreeItemCollapsibleState.Expanded);
            assert.strictEqual(state2, vscode.TreeItemCollapsibleState.Collapsed);
            assert.strictEqual(state3, vscode.TreeItemCollapsibleState.Expanded);
        });
    });

    suite("setTagExpanded", () => {
        test("should save tag expanded state as true", async () => {
            await StorageProvider.setTagExpanded("tag1", true);
            
            const state = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
        });

        test("should save tag expanded state as false", async () => {
            await StorageProvider.setTagExpanded("tag1", false);
            
            const state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test("should update existing tag state", async () => {
            // First set as expanded
            await StorageProvider.setTagExpanded("tag1", true);
            let state = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
            
            // Then update to collapsed
            await StorageProvider.setTagExpanded("tag1", false);
            state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test("should preserve other tag states when updating one tag", async () => {
            // Set multiple tags
            await StorageProvider.setTagExpanded("tag1", true);
            await StorageProvider.setTagExpanded("tag2", false);
            await StorageProvider.setTagExpanded("tag3", true);
            
            // Update one tag
            await StorageProvider.setTagExpanded("tag2", true);
            
            // Verify all states
            const state1 = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            const state2 = StorageProvider.getTagCollapsibleState("tag2", "startCollapsed");
            const state3 = StorageProvider.getTagCollapsibleState("tag3", "startCollapsed");
            
            assert.strictEqual(state1, vscode.TreeItemCollapsibleState.Expanded);
            assert.strictEqual(state2, vscode.TreeItemCollapsibleState.Expanded);
            assert.strictEqual(state3, vscode.TreeItemCollapsibleState.Expanded);
        });
    });

    suite("resetTagExpansionState", () => {
        test("should clear all saved tag states", async () => {
            // Set some states
            await StorageProvider.setTagExpanded("tag1", true);
            await StorageProvider.setTagExpanded("tag2", false);
            await StorageProvider.setTagExpanded("tag3", true);
            
            // Verify states are set
            let state1 = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state1, vscode.TreeItemCollapsibleState.Expanded);
            
            // Reset
            await StorageProvider.resetTagExpansionState();
            
            // Verify all states are cleared (should use default behavior)
            state1 = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            const state2 = StorageProvider.getTagCollapsibleState("tag2", "startExpanded");
            const state3 = StorageProvider.getTagCollapsibleState("tag3", "startCollapsed");
            
            assert.strictEqual(state1, vscode.TreeItemCollapsibleState.Collapsed);
            assert.strictEqual(state2, vscode.TreeItemCollapsibleState.Expanded);
            assert.strictEqual(state3, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test("should allow new states to be saved after reset", async () => {
            // Set and reset
            await StorageProvider.setTagExpanded("tag1", true);
            await StorageProvider.resetTagExpansionState();
            
            // Set new state
            await StorageProvider.setTagExpanded("tag1", false);
            
            // Verify new state
            const state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });
    });

    suite("Behavior mode integration", () => {
        test("alwaysExpanded should ignore saved state", async () => {
            // Set tag as collapsed
            await StorageProvider.setTagExpanded("tag1", false);
            
            // alwaysExpanded should still return Expanded
            const state = StorageProvider.getTagCollapsibleState("tag1", "alwaysExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
        });

        test("alwaysCollapsed should ignore saved state", async () => {
            // Set tag as expanded
            await StorageProvider.setTagExpanded("tag1", true);
            
            // alwaysCollapsed should still return Collapsed
            const state = StorageProvider.getTagCollapsibleState("tag1", "alwaysCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });

        test("startExpanded should respect user changes after initial render", async () => {
            // Initial state with startExpanded (no saved state)
            let state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
            
            // User collapses the tag
            await StorageProvider.setTagExpanded("tag1", false);
            
            // Next render should respect user's choice
            state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
            
            // User expands again
            await StorageProvider.setTagExpanded("tag1", true);
            
            // Should respect the new state
            state = StorageProvider.getTagCollapsibleState("tag1", "startExpanded");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
        });

        test("startCollapsed should respect user changes after initial render", async () => {
            // Initial state with startCollapsed (no saved state)
            let state = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
            
            // User expands the tag
            await StorageProvider.setTagExpanded("tag1", true);
            
            // Next render should respect user's choice
            state = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Expanded);
            
            // User collapses again
            await StorageProvider.setTagExpanded("tag1", false);
            
            // Should respect the new state
            state = StorageProvider.getTagCollapsibleState("tag1", "startCollapsed");
            assert.strictEqual(state, vscode.TreeItemCollapsibleState.Collapsed);
        });
    });
});
