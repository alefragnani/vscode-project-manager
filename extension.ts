// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
import path = require('path');
import {exec} from 'child_process';
import {execFile} from 'child_process';
//import {WindowsManager} from 'windows';

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
		//vscode.window.showInformationMessage('SAVE PROJECT');
		var wpath = vscode.workspace.rootPath;
		console.log("vscode.workspace.getPath: " + wpath);
		//var folder = path.dirname(wpath);
		wpath = wpath.substr(wpath.lastIndexOf("\\") + 1);
		console.log(" folder: " + wpath);
		
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
			
			var path = vscode.workspace.rootPath;
			
			// update the projects
			var projectFile = "projects.json";
			var items = []
			if (fs.existsSync(projectFile)) {
				items = JSON.parse(fs.readFileSync(projectFile).toString());
			}
			
			var found: boolean = false;
			for (var i = 0; i < items.length; i++) {
				var element = items[i];
				if (element.label == projectName) {
					found = true;
				}
			}
			if (!found) {
				items.push({ label: projectName, description: path });
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
					if (option.title == "Update") {
						for (var i = 0; i < items.length; i++) {
							if (items[i].label == projectName) {
								items[i].description = path;
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

		var projectFile = path.join(__dirname, "projects.json");
		var items = []
		if (fs.existsSync(projectFile)) {
			items = JSON.parse(fs.readFileSync(projectFile).toString());
		}

		var sortList = vscode.workspace.getConfiguration('projectManager').get('sortList');
		console.log(" sortlist: " + sortList);
		
		var itemsSorted = [];
		if (sortList == "Name") {
			itemsSorted = getSortedByName(items);
		} else {
			itemsSorted = getSortedByPath(items);
		}; 
		
		vscode.window.showQuickPick(itemsSorted).then(selection => {
			console.log("description: " + selection.description);	
			
			// 
			let projectPath = selection.description;
			let codePath = vscode.workspace.getConfiguration('projectManager').get('codePath', 'none');
			if (codePath == 'none') {
				vscode.window.showErrorMessage('No Code.exe path defined. Fix it in User Settings (projectManager.codePath)');
				return;				
			} else {
				let replaceable = codePath.split('\\');
				codePath = replaceable.join('\\\\');
				console.log('new codePath=' + codePath);
				
				replaceable = selection.description.split('\\');
				projectPath = replaceable.join('\\\\');
				console.log('new projectPath=' + projectPath);
			}		
			
			// var app = "c:\\program files\\microsoft vs code\\code.exe"
			// var args = selection.description;
			// // var cmdline = "\"" + app + "\" \"" + args + "\""; 
			// // var cmdline = "start \"code cmd\" "  + cmdline
			// //console.log(" cmdline: " + cmdline);
			// //var cmdline = "\"${app}\" /P\"${args}\" "
			// var cmdline = '\"' + app + '\" \"' + args + '\"';
			// //exec "start \"build cmd\" " + cmdline, cwd: folder
			// var folder = args;//path.dirname(args);
			// cmdline = '"C:\\Program Files\\Microsoft VS Code\\Code.exe" "C:\\Users\\Alessandro\\Documents\\vso\\Bookmarks\\"';
			// // child_process.execFile("c:\\program files\\microsoft vs code\\codeaa.exe", ["C:\Users\Alessandro\Documents\vso\duplicate-lines"]);
			//, folder);
			//exec('start \"open ui\" "C:\\Program Files\\Microsoft VS Code\\Code.exe" ', 
			
			
			//exec('start \"open ui\" "' + codePath + '" "' + projectPath + '"');
			exec('cmd /c "' + codePath + '" ' + projectPath);
			//execFile(codePath, [projectPath]);
			
			
			
			
			//??? exec('start \"open ui\" "C:\\Program Files\\Winmerge\\WinMergeU.exe" "C:\\Program Files\\Winmerge\\File.txt"', 
				// exec('start \"open ui\" "C:\\Program Files\\Winmerge\\WinMergeU.exe" "C:\\Program Files\\Winmerge\\File.txt"', 
				// exec('start \"open ui\" ' + cmdline, {
				// 	cwd: 'C:\\Users\\Alessandro\\Documents\\vso\\Bookmarks\\'
				// }, 
				// function(error, stdout, stderr) {
				// 	if (error !== null) {
				// 		console.log('exec error: ' + error);
				// 	}
				// });
			//vscode.commands.executeCommand("workbench.action.files.openFolder", selection.description).then(ok => {
			//	console.log(".then: ");
			//});
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
}