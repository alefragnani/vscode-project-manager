/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { ProjectManagerPublicApi } from '../../../api/api';

const timeout = async (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

suite('Extension Test Suite', () => {
    let extension: vscode.Extension<any>;
    vscode.window.showInformationMessage('Start all tests.');

    suiteSetup(() => {
        extension = vscode.extensions.getExtension('alefragnani.project-manager') as vscode.Extension<any>;
    });

    test('Sample test', () => {
        assert.equal(-1, [ 1, 2, 3 ].indexOf(5));
        assert.equal(-1, [ 1, 2, 3 ].indexOf(0));
    });

    test('Activation test', async () => {
        const api = await extension.activate() as ProjectManagerPublicApi;
        assert.equal(extension.isActive, true);
        assert.ok(api);
    });

    test('Public API saves and reads favorite projects', async () => {
        const api = await extension.activate() as ProjectManagerPublicApi;
        const name = `API test ${Date.now()}`;

        await api.saveProject(name, '/tmp/project-manager-api-test', [ 'api' ], 'api-profile');

        const favorites = await api.getFavoriteProjects();
        const savedProject = favorites.find(project => project.name === name);
        assert.ok(savedProject);
        assert.deepStrictEqual(savedProject, {
            name,
            rootPath: '/tmp/project-manager-api-test',
            tags: [ 'api' ],
            profile: 'api-profile',
            enabled: true
        });
        assert.ok((await api.getAllProjects()).some(project => project.name === name));
        await assert.rejects(api.saveProject(name, '/tmp/other-project'));
    });

    test('Extension loads in VSCode and is active', async () => {
        await timeout(1500);
        assert.equal(extension.isActive, true);
    });
});
