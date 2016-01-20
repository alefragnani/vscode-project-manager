// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
import path = require('path');
import {exec} from 'child_process';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate() { 

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "project-manager" is now active!'); 

	
	// Save the Projects
	vscode.commands.registerCommand('projectManager.saveProject', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		var wpath = vscode.workspace.rootPath;
		wpath = wpath.substr(wpath.lastIndexOf("\\") + 1);
		
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
			
			// var projectFile = path.join(__dirname, "projects.json");
            let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
			var projectFile = path.join(appdata, "Code/User/projects.json");
			var items = []
			if (fs.existsSync(projectFile)) {
                items = loadProjects(projectFile);            
                if (items == null) {
                    return;
                } 
				//items = JSON.parse(fs.readFileSync(projectFile).toString());
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
				fs.writeFileSync(projectFile, JSON.stringify(items));
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
								fs.writeFileSync(projectFile, JSON.stringify(items));
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


	// List the Projects and allow the user to pick (select) one of them to activate
	vscode.commands.registerCommand('projectManager.listProjects', () => {
		// The code you place here will be executed every time your command is executed

		// var projectFile = path.join(__dirname, "projects.json");
        let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
		var projectFile = path.join(appdata, "Code/User/projects.json");
		var items = []
		if (fs.existsSync(projectFile)) {      
            items = loadProjects(projectFile);            
            if (items == null) {
                return;
            }      
            // try {
            //     items = JSON.parse(fs.readFileSync(projectFile).toString());                
            // } catch (error) {
            //     vscode.window.showErrorMessage('Error loading projects.json file. Error message: ' + error.toString());
            //     return;
            // }
		} else {
            vscode.window.showInformationMessage('No projects saved yet!');
            return;
        }

		var sortList = vscode.workspace.getConfiguration('projectManager').get('sortList');
		
		var itemsSorted = [];
		if (sortList == "Name") {
			itemsSorted = getSortedByName(items);
		} else {
			itemsSorted = getSortedByPath(items);
		}; 
		
		vscode.window.showQuickPick(itemsSorted).then(selection => {
			
			if (typeof selection == 'undefined') {
				return;
			}			
			
			// code path
			let codePath = vscode.workspace.getConfiguration('projectManager').get('codePath', 'none');
			if (codePath == 'none') {
				codePath = "Code";	
			} else {
                codePath = normalizePath(codePath);
			}		    

			// project path
			let projectPath = selection.description;
            projectPath = normalizePath(projectPath);
            
            let openInNewWindow: boolean = vscode.workspace.getConfiguration('projectManager').get('openInNewWindow', true);
            let reuseCmdOption: string = openInNewWindow ? "" : " -r";
            
			exec(codePath + " " + projectPath + reuseCmdOption);
		});
	});
    
    
    vscode.commands.registerCommand('projectManager.editProjects', () => {
        let appdata = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
		var projectFile = path.join(appdata, "Code/User/projects.json");

        vscode.workspace.openTextDocument(projectFile).then(doc => {
			vscode.window.showTextDocument(doc);
		});
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
    
    function surroundByDoubleQuotes(path: string): string {
        return "\"" + path + "\""
    }
    
    function normalizePath(path: string): string {
        let normalizedPath: string = path;
        let replaceable = normalizedPath.split('\\');
        normalizedPath = replaceable.join('\\\\');
        normalizedPath = surroundByDoubleQuotes(normalizedPath);
        return normalizedPath;
    }
    
    function loadProjects(projectFile: string): any[] {
        var items = [];
        try {
            items = JSON.parse(fs.readFileSync(projectFile).toString());
            return items;                
        } catch (error) {
            vscode.window.showErrorMessage('Error loading projects.json file. Error message: ' + error.toString());
            return null;
        }
    }
}