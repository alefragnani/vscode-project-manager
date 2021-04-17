/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*  
*  Based on github.com/vscode/vscode-extensions-sample
*--------------------------------------------------------------------------------------------*/

import { QuickInputButton, QuickPickItem, ThemeIcon } from "vscode";
import { Project } from "../../vscode-project-manager-core/src/project";
import { NO_TAGS_DEFINED } from "../../vscode-project-manager-core/src/sidebar/constants";
import { Storage } from "../../vscode-project-manager-core/src/storage";
import { MultiStepInput } from "./multiStepInput";

let tagList = ['Personal', 'Work'];

export interface PickTagOptions {
    useDefaultTags: boolean,
    useNoTagsDefined: boolean
}

class Button implements QuickInputButton {
    constructor(public iconPath: ThemeIcon, public tooltip: string) { }
}

const createTagButton = new Button(new ThemeIcon('plus'), 'Create Tag');

// let tags: QuickPickItem[] = tagList.map(label => ({ label }));

interface State {
    name: string;
    tags: QuickPickItem[];
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

export async function editProjectPicker(project: Project, storage: Storage, options?: PickTagOptions) {

    // start
    async function collectInputs() {
        const state = {} as Partial<State>;
        state.name = project.name;
        state.tags = project.tags.map(tag => <QuickPickItem>{
            label: tag,
            picked: true
        })

		await MultiStepInput.run(input => pickTag(input, state));
		return state as State;
    }    
    
    // step 1
    const title = 'Edit Project';
    async function pickTag(input: MultiStepInput, state: Partial<State>) {

        const storageTags = storage.getAvailableTags();
        
        if (options?.useDefaultTags) {
            tagList.forEach(tag => {
                if (!storageTags.includes(tag)) {
                    storageTags.push(tag);
                }
            });
        }

        if (state.tags?.length > 0) {
            state.tags.forEach(tag => {
                if (!storageTags.includes(tag.label)) {
                    storageTags.push(tag.label);
                }
            });
        }

        if (options?.useNoTagsDefined) {
            storageTags.push(NO_TAGS_DEFINED);
        }

        // tags = tags.map(i => <QuickPickItem>{label: i.label, picked: state.tags.filter(si => si.label === i.label).length === 1});
        const items: QuickPickItem[] = storageTags.map(tag => {
            return {
                label: tag,
                picked: project.tags.includes(tag) 
                        || state.tags.map(tag => tag.label).includes(tag)
            }
        });

		const pick = await input.showQuickPickMultiSelect({
			title,
			step: 1,
			totalSteps: 1,
			placeholder: 'Pick a tag',
			items: items,
			// activeItem: state.tags,//typeof state.tags !== 'string' ? state.tags : undefined,
            selectedItems: state.tags,
			buttons: [createTagButton],
			shouldResume: shouldResume
		});
		if (pick instanceof Button) {
			return (input: MultiStepInput) => inputTagName(input, state);
		}
		state.tags = pick;
        // return state;
		// return (input: MultiStepInput) => inputName(input, state);
	}
    
    // step 1 - button
    async function inputTagName(input: MultiStepInput, state: Partial<State>) {
		const statetags = await input.showInputBox({
			title,
			step: 2,
			totalSteps: 2,
			value: typeof state.tags === 'string' ? state.tags : '',
			prompt: 'Choose a unique name for the tag',
			validate: validateTagNameIsUnique,
			shouldResume: shouldResume
		});
        state.tags.push({label: statetags, picked: true})
		tagList.push(...state.tags.map(item => item.label));
		return (input: MultiStepInput) => pickTag(input, state);
		// return (input: MultiStepInput) => inputName(input, state);
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