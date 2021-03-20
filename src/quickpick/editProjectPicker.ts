/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*  
*  Based on github.com/vscode/vscode-extensions-sample
*--------------------------------------------------------------------------------------------*/

import { QuickInputButton, QuickPickItem, ThemeIcon } from "vscode";
import { Project } from "../../vscode-project-manager-core/src/model/storage";
import { MultiStepInput } from "./multiStepInput";

let tagList = ['Personal', 'Work'];

class Button implements QuickInputButton {
    constructor(public iconPath: ThemeIcon, public tooltip: string) { }
}

const createTagButton = new Button(new ThemeIcon('plus'), 'Create Tag');

const tags: QuickPickItem[] = tagList.map(label => ({ label }));

interface State {
    name: string;
    tags: QuickPickItem[] | string;
    enabled: boolean;

    step: number;
    totalSteps: number;
}

function shouldResume() {
    // Could show a notification with the option to resume.
    return new Promise<boolean>((resolve, reject) => {
        // noop
    });
}

async function validateTagNameIsUnique(name: string) {
    return tagList.includes(name) ? 'Tag already exists' : undefined;
}

async function validateProjectNameIsDefined(name: string) {
    return name === '' ? 'Name is not defined' : undefined;
}

export async function editProjectPicker(project: Project) {

    // start
    async function collectInputs() {
        const state = {} as Partial<State>;
        state.name = project.name;

		await MultiStepInput.run(input => pickTag(input, state));
		return state as State;
    }    
    
    // step 1
    const title = 'Edit Project';
    async function pickTag(input: MultiStepInput, state: Partial<State>) {
		const pick = await input.showQuickPickMultiSelect({
			title,
			step: 1,
			totalSteps: 3,
			placeholder: 'Pick a tag',
			items: tags,
			activeItem: typeof state.tags !== 'string' ? state.tags : undefined,
			buttons: [createTagButton],
			shouldResume: shouldResume
		});
		if (pick instanceof Button) {
			return (input: MultiStepInput) => inputTagName(input, state);
		}
		state.tags = pick;
		return (input: MultiStepInput) => inputName(input, state);
	}
    
    // step 1 - button
    async function inputTagName(input: MultiStepInput, state: Partial<State>) {
		state.tags = await input.showInputBox({
			title,
			step: 2,
			totalSteps: 4,
			value: typeof state.tags === 'string' ? state.tags : '',
			prompt: 'Choose a unique name for the tag',
			validate: validateTagNameIsUnique,
			shouldResume: shouldResume
		});
		tagList.push(state.tags);
		return (input: MultiStepInput) => inputName(input, state);
	}

    // step 2
    async function inputName(input: MultiStepInput, state: Partial<State>) {
		const additionalSteps = typeof state.tags === 'string' ? 1 : 0;
		// TODO: Remember current value when navigating back.
		state.name = await input.showInputBox({
			title,
			step: 2 + additionalSteps,
			totalSteps: 3 + additionalSteps,
			value: state.name || '',
			prompt: 'Type a name for your project',
			validate: validateProjectNameIsDefined,
			shouldResume: shouldResume
		});
		// return (input: MultiStepInput) => pickRuntime(input, state);
	}

    const state = await collectInputs();
    console.log(state);
    return state;
}