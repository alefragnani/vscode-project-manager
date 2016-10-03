// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
import path = require('path');
import os = require('os');
import {exec} from 'child_process';

import stack = require('./stack');

const homeDir = os.homedir();
const homePathVariable = '$home';
const PROJECTS_FILE = 'projects.json';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) { 
    
    let projectsStored: string = context.globalState.get<string>('recent', '');
    let aStack: stack.StringStack = new stack.StringStack();
    aStack.fromString(projectsStored);
    showStatusBar();
    
    // register commands
    vscode.commands.registerCommand('projectManager.saveProject', () => saveProject());
    vscode.commands.registerCommand('projectManager.listProjects', () => listProjects(false));
    vscode.commands.registerCommand('projectManager.listProjectsNewWindow', () => listProjects(true));
    vscode.commands.registerCommand('projectManager.editProjects', () => editProjects());

    function showStatusBar(projectName?: string) {

        let statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        // if we have a projectName, we don't need to search. 
        if (projectName) {
            statusItem.text = projectName;
            statusItem.show();
            return;
        }

        let currentProjectPath = compactHomePath(vscode.workspace.rootPath);

        let items = []
        if (fs.existsSync(getProjectFilePath())) {
            items = loadProjects(getProjectFilePath());
            if (items == null) {
                return;
            }
        }

        let foundProjectLabel: string = null;
        for (let i = 0; i < items.length; i++) {
            let element = items[i];
            if (element.description == currentProjectPath) {
                foundProjectLabel = element.label;
            }
        }

        if (foundProjectLabel) {
            statusItem.text = foundProjectLabel;
            statusItem.show();
        }
    };


    // function commands

    function saveProject() {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        var wpath = vscode.workspace.rootPath;
        if (process.platform == 'win32') {
            wpath = wpath.substr(wpath.lastIndexOf("\\") + 1);
        } else {
            wpath = wpath.substr(wpath.lastIndexOf("/") + 1);
        }

        // Issue #42 - Temporary Fix for Insider version
        // Issue #51 - Temporary Fix for Stable version too :(
        //if (vscode.env.appName.indexOf('Insiders') > 0) {
            wpath = '';
        //}
		
        // ask the PROJECT NAME (suggest the )
        var ibo = <vscode.InputBoxOptions>{
            prompt: "Project Name",
            placeHolder: "Type a name for your project",
            value: wpath
        }

        vscode.window.showInputBox(ibo).then(projectName => {
            //console.log("Project Name: " + projectName);

            if (typeof projectName == 'undefined') {
                return;
            }

            // 'empty'
            if (projectName == '') {
                vscode.window.showWarningMessage('You must define a name for the project.');
                return;
            }

            var rootPath = compactHomePath(vscode.workspace.rootPath);

            var items = []
            if (fs.existsSync(getProjectFilePath())) {
                items = loadProjects(getProjectFilePath());
                if (items == null) {
                    return;
                } 
            }

            var found: boolean = false;
            for (var i = 0; i < items.length; i++) {
                var element = items[i];
                if (element.label == projectName) {
                    found = true;
                }
            }

            if (!found) {
                aStack.push(projectName);
                context.globalState.update('recent', aStack.toString());
                items.push({ label: projectName, description: rootPath });
                fs.writeFileSync(getProjectFilePath(), JSON.stringify(items, null, "\t"));
                vscode.window.showInformationMessage('Project saved!');
                showStatusBar(projectName);
            } else {
                var optionUpdate = <vscode.MessageItem>{
                    title: "Update"
                };
                var optionCancel = <vscode.MessageItem>{
                    title: "Cancel"
                };

                vscode.window.showInformationMessage('Project already exists!', optionUpdate, optionCancel).then(option => {
                    // nothing selected
                    if (typeof option == 'undefined') {
                        return;
                    }

                    if (option.title == "Update") {
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].label == projectName) {
                                items[i].description = rootPath;
                                aStack.push(projectName);
                                context.globalState.update('recent', aStack.toString());
                                fs.writeFileSync(getProjectFilePath(), JSON.stringify(items, null, "\t"));
                                vscode.window.showInformationMessage('Project saved!');
                                showStatusBar(projectName);
                                return;
                            }
                        }
                    } else {
                        return;
                    }
                });
            }
        });


    };
      
    
    function listProjects(forceNewWindow: boolean) {
        let items = [];
        let itemsToShow = [];
        
        if (fs.existsSync(getProjectFilePath())) {
            items = loadProjects(getProjectFilePath());
            if (items == null) {
                return;
            }      
        } else {
            vscode.window.showInformationMessage('No projects saved yet!');
            return;
        }
        
        itemsToShow = expandHomePaths(items);
        itemsToShow = removeRootPath(itemsToShow);
        itemsToShow = indicateInvalidPaths(itemsToShow);

        var sortList = vscode.workspace.getConfiguration('projectManager').get('sortList', 'Name');

        var itemsSorted = [];
        
        switch (sortList) {
            case 'Path':
                itemsSorted = getSortedByPath(itemsToShow); 
                break;
        
            case 'Saved': 
                itemsSorted = itemsToShow;
                break;
                
            case 'Recent':
                itemsSorted = getSortedByRecent(itemsToShow);
                break;
                
            default:
                itemsSorted = getSortedByName(itemsToShow);
                break;
        }

        vscode.window.showQuickPick(itemsSorted).then(selection => {

            if (typeof selection == 'undefined') {
                return;
            }			
            
            if (!fs.existsSync(selection.description.toString())) {
                var optionUpdateProject = <vscode.MessageItem>{
                    title: "Update Project"
                };
                var optionDeleteProject = <vscode.MessageItem>{
                    title: "Delete Project"
                };

                vscode.window.showErrorMessage('The project has an invalid path. What would you like to do?', optionUpdateProject, optionDeleteProject).then(option => {
                    // nothing selected
                    if (typeof option == 'undefined') {
                        return;
                    }

                    if (option.title == "Update Project") {
                        vscode.commands.executeCommand('projectManager.editProjects');
                    } else { // Update Project
                        let itemsFiltered = [];
                        itemsFiltered = items.filter(value => value.description.toString().toLowerCase() != selection.description.toLowerCase());
                        fs.writeFileSync(getProjectFilePath(), JSON.stringify(itemsFiltered, null, "\t"));
                        return;
                    }
                }); 
            } else {
                // project path
                let projectPath = selection.description;
                projectPath = normalizePath(projectPath);
                
                // update MRU               
                aStack.push(selection.label);
                context.globalState.update('recent', aStack.toString()); 

                let openInNewWindow: boolean = vscode.workspace.getConfiguration('projectManager').get('openInNewWindow', true);
                let uri: vscode.Uri = vscode.Uri.file(projectPath); 
                vscode.commands.executeCommand('vscode.openFolder', uri, openInNewWindow || forceNewWindow) 
                    .then(
                        value => ( {} ),  //done 
                        value => vscode.window.showInformationMessage('Could not open the project!') ); 
            }
        });
    };
    
    function editProjects() {
        if (fs.existsSync(getProjectFilePath())) {
            vscode.workspace.openTextDocument(getProjectFilePath()).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        } else {
            vscode.window.showInformationMessage('No projects saved yet!');
        }
    };


    function getSortedByName(items: any[]): any[] {
        var itemsSorted = [] = items.sort((n1, n2) => {
            if (n1.label > n2.label) {
                return 1;
            }

            if (n1.label < n2.label) {
                return -1;
            }

            return 0;
        });
        return itemsSorted;
    }

    function getSortedByPath(items: any[]): any[] {
        var itemsSorted = [] = items.sort((n1, n2) => {
            if (n1.description > n2.description) {
                return 1;
            }

            if (n1.description < n2.description) {
                return -1;
            }

            return 0;
        });
        return itemsSorted;
    }
    
    function getSortedByRecent(items: any[]): any[] {
        
        if (aStack.length() == 0) {
            return items;
        }
        
        let idx: number;        
        let loadedProjects = items;
        
        for (let index = 0; index < aStack.length(); index++) {
            let element: string = aStack.getItem(index);
            
            let found: number = -1;
            for (let i = 0; i < loadedProjects.length; i++) {
                let itemElement = loadedProjects[i];
                if (itemElement.label == element) {
                    found = i;
                    break;
                }
            }
            
            if (found > -1) {
                let removedProject = loadedProjects.splice(found, 1);
                loadedProjects.unshift(removedProject[0]);
            }
        }
        
        return loadedProjects;
    }
    
    function removeRootPath(items:any[]): any[] {
        if (!vscode.workspace.rootPath) {
            return items;
        } else {
            return items.filter(value => value.description.toString().toLowerCase() != vscode.workspace.rootPath.toLowerCase());
        }
    }
    
    function indicateInvalidPaths(items:any[]): any[] {
        for (var index = 0; index < items.length; index++) {
            var element = items[index];
            
            if (!fs.existsSync(element.description.toString()) ) {
                items[index].detail = '$(circle-slash) Path does not exist';
            }
        }
        
        return items;
    }
    
    
    function pathIsUNC(path:string) {
      return path.indexOf('\\\\') == 0;
    }

    /**
     * If the project path is in the user's home directory then store the home directory as a
     * parameter. This will help in situations when the user works with the same projects on 
     * different machines, under different user names. 
     */
    function compactHomePath(path: string) {
        if (path.indexOf(homeDir) === 0) {
            return path.replace(homeDir, homePathVariable);
        }

        return path;
    }

    /**
     * Expand $home parameter from path to real os home path
     */
    function expandHomePath(path: string) {
        if (path.indexOf(homePathVariable) === 0) {
            return path.replace(homePathVariable, homeDir);
        }

        return path;
    }
    
    function expandHomePaths(items: any[]) {
        return items.map(item => {
            item.description = expandHomePath(item.description);
            return item;
        });
    }

    function normalizePath(path: string): string {
        let normalizedPath: string = path;
        
        if (!pathIsUNC(normalizedPath)) {
          let replaceable = normalizedPath.split('\\');
          normalizedPath = replaceable.join('\\\\');
        }
        
        return normalizedPath;
    }

    function loadProjects(file: string): any[] {
        var items = [];
        try {
            items = JSON.parse(fs.readFileSync(file).toString());
            return items;
        } catch (error) {
            var optionOpenFile = <vscode.MessageItem>{
                title: "Open File"
            };
            vscode.window.showErrorMessage('Error loading projects.json file. Message: ' + error.toString(), optionOpenFile).then(option => {
                // nothing selected
                if (typeof option == 'undefined') {
                    return;
                }

                if (option.title == "Open File") {
                    vscode.commands.executeCommand('projectManager.editProjects');
                } else {
                    return;
                }
            });
            return null;
        }
    }

    function getChannelPath(): string {
        if (vscode.env.appName.indexOf('Insiders') > 0) {
            return 'Code - Insiders';
        } else {
            return 'Code';
        }
    }

    function getProjectFilePath() {
        let projectFile: string;
        let projectsLocation: string = vscode.workspace.getConfiguration('projectManager').get<string>('projectsLocation');
        if (projectsLocation != '') {
            projectFile = path.join(projectsLocation, PROJECTS_FILE);
        } else {
            let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
            let channelPath: string = getChannelPath();
            projectFile = path.join(appdata, channelPath, 'User', PROJECTS_FILE);        
            // in linux, it may not work with /var/local, then try to use /home/myuser/.config
            if ((process.platform == 'linux') && (!fs.existsSync(projectFile))) {
                projectFile = path.join(homeDir, '.config/', channelPath, 'User', PROJECTS_FILE);       
            }
        }
        return projectFile;
    }
} 
