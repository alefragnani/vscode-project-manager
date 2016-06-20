// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
import path = require('path');
import {exec} from 'child_process';
const untildify = require('untildify');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate() { 

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    //console.log('Congratulations, your extension "project-manager" is now active!'); 
    
    // 
    let projectFile: string;
    let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
    projectFile = path.join(appdata, "Code/User/projects.json");
    
    // in linux, it may not work with /var/local, then try to use /home/myuser/.config
    if ((process.platform == 'linux') && (!fs.existsSync(projectFile))) {
        let os = require('os');
        projectFile = path.join(os.homedir(), '.config/Code/User/projects.json');
    }
	
    // Save the Projects
    vscode.commands.registerCommand('projectManager.saveProject', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        var wpath = vscode.workspace.rootPath;
        if (process.platform == 'win32') {
            wpath = wpath.substr(wpath.lastIndexOf("\\") + 1);
        } else {
            wpath = wpath.substr(wpath.lastIndexOf("/") + 1);
        }
		
        // ask the PROJECT NAME (suggest the )
        var ibo = <vscode.InputBoxOptions>{
            prompt: "Project Name",
            placeHolder: "Noname",
            value: wpath
        }

        vscode.window.showInputBox(ibo).then(projectName => {
            console.log("Project Name: " + projectName);

            if (typeof projectName == 'undefined') {
                return;
            }

            var rootPath = vscode.workspace.rootPath;
            var items = []
            if (fs.existsSync(projectFile)) {
                items = loadProjects(projectFile);
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
                items.push({ label: projectName, description: rootPath });
                fs.writeFileSync(projectFile, JSON.stringify(items, null, "\t"));
                vscode.window.showInformationMessage('Project saved!');
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
                                fs.writeFileSync(projectFile, JSON.stringify(items, null, "\t"));
                                vscode.window.showInformationMessage('Project saved!');
                                return;
                            }
                        }
                    } else {
                        return;
                    }
                });
            }
        });


    });
    
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
            const resolvedSelectionPath = untildify(element.description.toString());
            
            if (!fs.existsSync(resolvedSelectionPath)) {
                items[index].detail = '$(circle-slash) Path does not exists';
            }
        }
        
        return items;
    }
    
    // List the Projects and allow the user to pick (select) one of them to activate
    vscode.commands.registerCommand('projectManager.listProjects', () => {
        let items = [];
        let itemsToShow = [];
        
        if (fs.existsSync(projectFile)) {
            items = loadProjects(projectFile);
            if (items == null) {
                return;
            }      
        } else {
            vscode.window.showInformationMessage('No projects saved yet!');
            return;
        }
        
        itemsToShow = removeRootPath(items);
        itemsToShow = indicateInvalidPaths(itemsToShow)

        var sortList = vscode.workspace.getConfiguration('projectManager').get('sortList');

        var itemsSorted = [];
        if (sortList == "Name") {
            itemsSorted = getSortedByName(itemsToShow);
        } else {
            itemsSorted = getSortedByPath(itemsToShow);
        };

        vscode.window.showQuickPick(itemsSorted).then(selection => {

            if (typeof selection == 'undefined') {
                return;
            }			
            const resolvedSelectionPath = untildify(selection.description.toString());

            if (!fs.existsSync(resolvedSelectionPath)) {
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
                        fs.writeFileSync(projectFile, JSON.stringify(itemsFiltered, null, "\t"));
                        return;
                    }
                }); 
            } else {
                // project path
                let projectPath = selection.description;
                projectPath = untildify(normalizePath(projectPath));

                let openInNewWindow: boolean = vscode.workspace.getConfiguration('projectManager').get('openInNewWindow', true);
                let uri: vscode.Uri = vscode.Uri.file(projectPath) 
                vscode.commands.executeCommand('vscode.openFolder', uri, openInNewWindow) 
                    .then(
                        value => ( {} ),  //done 
                        value => vscode.window.showInformationMessage('Could not open the project!') ); 
            }
        });
    });


    vscode.commands.registerCommand('projectManager.editProjects', () => {
        if (fs.existsSync(projectFile)) {
            vscode.workspace.openTextDocument(projectFile).then(doc => {
                vscode.window.showTextDocument(doc);
            });
        } else {
            vscode.window.showInformationMessage('No projects saved yet!');
        }
    });


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
    
    function pathIsUNC(path:string) {
      return path.indexOf('\\\\') == 0;
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
}
