import * as vscode from "vscode";
import { ThemeIcons } from "vscode-ext-codicons";
import { AutodetectedProjectList, CustomProjectLocator } from "../autodetect/abstractLocator";
import { GitRepositoryDetector } from "../autodetect/gitRepositoryDetector";
import { AnyRepositoryDetector } from "../autodetect/anyRepositoryDetector";
import { VSCodeRepositoryDetector } from "../autodetect/vscodeRepositoryDetector";
import { MercurialRepositoryDetector } from "../autodetect/mercurialRepositoryDetector";
import { SvnRepositoryDetector } from "../autodetect/svnRepositoryDetector";
import { RepositoryDetector } from "../autodetect/repositoryDetector";
import { ProjectNode } from "./nodes";
import { addParentFolderToDuplicates } from "../utils/path";

export interface FolderConfig {
    name: string;
    folder: string;
    kind?: string;
    maxDepthRecursion?: number;
}

export class FolderNode extends vscode.TreeItem {
    constructor(public readonly label: string, public readonly folderPath: string) {
        super(label, vscode.TreeItemCollapsibleState.Collapsed);
        this.iconPath = ThemeIcons.folder;
        this.contextValue = "FolderNodeKind";
    }
}

function buildDetector(kind: string): RepositoryDetector {
    switch (kind) {
        case "any": return new AnyRepositoryDetector([]);
        case "vscode": return new VSCodeRepositoryDetector();
        case "hg": return new MercurialRepositoryDetector([".hg"]);
        case "svn": return new SvnRepositoryDetector([".svn", "pristine"]);
        default: return new GitRepositoryDetector([".git"]);
    }
}

export class FoldersProvider implements vscode.TreeDataProvider<FolderNode | ProjectNode> {

    public readonly onDidChangeTreeData: vscode.Event<FolderNode | ProjectNode | void>;
    private readonly internalOnDidChangeTreeData = new vscode.EventEmitter<FolderNode | ProjectNode | void>();
    public locators = new Map<string, CustomProjectLocator>();
    private pending = new Map<string, Promise<AutodetectedProjectList>>();

    constructor() {
        this.onDidChangeTreeData = this.internalOnDidChangeTreeData.event;
        this.rebuild();
    }

    public rebuild(forceRefresh = false): void {
        const configs = this.getConfigs();
        const newLocators = new Map<string, CustomProjectLocator>();

        configs.forEach((cfg, index) => {
            const kind = cfg.kind ?? "git"
            const locator = new CustomProjectLocator(
                `folder_${index}_${cfg.name}_${kind}`,
                cfg.name,
                buildDetector(kind)
            );

            locator.setFixedBaseFolders([cfg.folder], cfg.maxDepthRecursion || 1);
            if (forceRefresh) locator.invalidate();

            newLocators.set(cfg.name, locator);
        });

        this.locators = newLocators;
        this.pending.clear();
        this.internalOnDidChangeTreeData.fire();
    }

    public getTreeItem(element: FolderNode | ProjectNode): vscode.TreeItem {
        return element;
    }

    public async getChildren(element?: FolderNode | ProjectNode): Promise<(FolderNode | ProjectNode)[]> {
        if (!element) {
            return this.getConfigs().map(cfg => new FolderNode(cfg.name, cfg.folder));
        }

        if (element instanceof FolderNode) {
            return this.getProjectNodes(element.label as string);
        }

        return [];
    }

    public showTreeView(): void {
        vscode.commands.executeCommand("setContext", "projectManager.canShowTreeViewFolders",
            this.getConfigs().length > 0);
    }

    private async getProjectNodes(folderName: string): Promise<ProjectNode[]> {
        const locator = this.locators.get(folderName);
        if (!locator) return [];

        let list: AutodetectedProjectList;
        if (locator.isAlreadyLocated()) {
            list = locator.projectList;
        } else {
            if (!this.pending.has(folderName)) {
                const scan = locator.locateProjects();

                this.pending.set(folderName, scan);
                scan.then(() => this.pending.delete(folderName));
            }

            list = await this.pending.get(folderName)!;
        }

        if (list.length === 0) return [];
        list.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

        return addParentFolderToDuplicates(list).map(item =>
            new ProjectNode(item.name, vscode.TreeItemCollapsibleState.None, item.icon,
                { name: item.name, detail: item.parent, path: item.path },
                { command: "_projectManager.open", title: "", arguments: [item.path, item.name] }
            )
        );
    }

    private getConfigs(): FolderConfig[] {
        return vscode.workspace.getConfiguration("projectManager")
            .get<FolderConfig[]>("folders", []);
    }
}
