import fs = require("fs");
import path = require("path");
import { CustomProjectLocator, CustomRepositoryDetector} from "./abstractLocator";

export class VisualStudioCodeLocator extends CustomRepositoryDetector {

    // public isRepoDir(projectPath: string) {
    //     return fs.existsSync(path.join(projectPath, ".vscode"));
    // }

}