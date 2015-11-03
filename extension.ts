// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs = require('fs');
import path = require('path');
import child_process = require('child_process');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate() { 

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "project-manager" is now active!'); 

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	// vscode.commands.registerCommand('extension.sayHello', () => {
	// 	// The code you place here will be executed every time your command is executed

	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World!');
	// });
	
	vscode.commands.registerCommand('projectManager.saveProject', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		//vscode.window.showInformationMessage('SAVE PROJECT');
		var wpath = vscode.workspace.getPath();
		console.log("vscode.workspace.getPath: " + wpath);
		//var folder = path.dirname(wpath);
		wpath = wpath.substr(wpath.lastIndexOf("\\") + 1);
		console.log(" folder: " + wpath);
		
		// ask the PROJECT NAME (suggest the )
		var ibo = <vscode.InputBoxOptions>{
			prompt: "Enter the Project Name",
			placeHolder: wpath//"Noname"
		}

		vscode.window.showInputBox(ibo).then(projectName => {
			console.log("Project Name: " + projectName);
			var path = vscode.workspace.getPath();
			
			// update the projects
			var projectFile = "projects.json";
			var items = []
			if (fs.existsSync(projectFile)) {
				items = JSON.parse(fs.readFileSync(projectFile).toString());
			}
			
			// items.reduce(function (matches, item) {
			// 	if (item.label == projectName) {
			// 		return matches.concat(item);
			// 	} else {
			// 		return matches
			// 	}
			// }, []); 
			if (items.indexOf({ label: projectName }) < 0) {
				items.push({ label: projectName, description: path });
			}

			fs.writeFileSync(projectFile, JSON.stringify(items));
			vscode.window.showInformationMessage('Project saved!');	
			
			// save the state memento
			// let memento = vscode.extensions.getStateMemento('projectManager', true);
			// memento.getValue('projects').then(value => {
			// 	console.log('My Configuration is: ', value);
				
			// 	// le em formato ARRAY
				
			// 	// sava em formato ARRAY
			// 	memento.setValue('projects', projectName);
			// });
			// memento.setValue('projects', projectName);
		});


	});


	// function sortByLabel(a, b: any):  {
	// 	return a.label < b.label;
	// }

	vscode.commands.registerCommand('projectManager.listProjects', () => {
		// The code you place here will be executed every time your command is executed

		// Display a message box to the user
		//vscode.window.showInformationMessage('LIST PROJECTS');
		var projectFile = "projects.json";
		var items = []
		if (fs.existsSync(projectFile)) {
			items = JSON.parse(fs.readFileSync(projectFile).toString());
		}

		// sorted
		var itemsSorted = [] = items.sort((n1, n2) => {
			if (n1.label > n2.label) {
				return 1;
			}

			if (n1.label < n2.label) {
				return -1;
			}

			return 0;
		});
				
		//var items = [];
		//items.push({ label: "First Project", description: "C:\\coisa\\x" });
		//items.push({ label: "Second Project", description: "D:\\NADA\\sdfsdf" });

		vscode.window.showQuickPick(itemsSorted).then(selection => {
			if (selection.label == "First Project") {
				console.log(" primeiro ");
			} else {
				console.log(" outro ");
			}

			console.log("description: " + selection.description);			
			
			// 			var app = "c:\\program files\\microsoft vs code\\code.exe"
			// 			var args = selection.description;
			// 			var cmdline = "\"" + app + "\" \"" + args + "\""; 
			// 			var cmdline = "start \"code cmd\" "  + cmdline
			// 			console.log(" cmdline: " + cmdline);
			// //		    cmdline = "\"#{aPath}\" /P\"#{filePath}\" "
			// //		    exec "start \"build cmd\" " + cmdline, cwd: folder
			// 			child_process.exec(cmdline);

			vscode.commands.executeCommand("workbench.action.files.openFolder", selection.description);

		});

		//fs.writeFileSync(projectFile, JSON.stringify(items));
	});
	
	
	// function readOptions(): Settings {
	//     var CONFIGFILE = ".vscode\\spellMD.json";
	// 	var cfg: any = readJsonFile(CONFIGFILE);

	//     function readJsonFile(file): any {
	//         try {
	//             cfg = JSON.parse(fs.readFileSync(file).toString());
	//         }
	//         catch (err) {
	//             cfg = JSON.parse('{\
	// 				"version": "0.1.0", \
	// 				"ignoreWordsList": [], \
	// 				"replaceRegExp": ["/\\\\]\\\\(([^\\\\)]+)\\\\)/g"], \
	// 				"mistakeTypeToStatus": { \
	// 					"Spelling": "Warning", \
	// 					"Passive Voice": "Info", \
	// 					"Complex Expression": "Warning",\
	// 					"Hyphen Required": "Warning"\
	// 				}\
	// 			}');
	//         }
	// 		return cfg;
	//     }

	// 	return {
	// 			enable: true,
	// 			ignoreWordsList: cfg.ignoreWordsList,
	// 			mistakeTypeToStatus: cfg.mistakeTypeToStatus,
	// 			replaceRegExp: cfg.replaceRegExp
	// 	}
	// }

	
}