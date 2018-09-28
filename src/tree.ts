import { ProjectInQuickPickList } from './ProjectProvider';

export interface TreeItem {
  name: string;
  path: string;
  parentPath: string;
  isDirectory: boolean;
  label: string;
  description: string;
  metadata?: any;
}

export default class Tree {
  private list: ProjectInQuickPickList;

  constructor (list: ProjectInQuickPickList) {
    this.list = list;
  }

  /**
   * clean characters `[./\]` around of path;
   * @param path 
   */
  static trimPath (path) {
    let trimPatten = /(^[\.,\\\/\$\~]*|[\.\/\\]*$)/ig;

    return path.replace(trimPatten, '');
  }

  /**
   * groupBy collection by property
   * @param collection 
   * @param prop 
   */
  static groupBy (collection = [], prop) {
    let group = {}

    collection.forEach(item => {
      group[item[prop]] = group[item[prop]] || [];
      group[item[prop]].push(item);
    })

    return group;
  }

  private hasChildren(path) {
    return Tree.trimPath(path).split(/\/\\/).length > 1;
  }

  private groupChildren(children) {
    let group = Tree.groupBy(children, 'name');
    let folders = [];

    Object.keys(group).forEach(key => {
      let items = group[key];
      let folder;

      if (items.length === 1) {
        folder = {
          ...items[0],
          label: Tree.trimPath(items[0].label).split(/[\/\\]/).pop(),
          isDirectory: false
        }
      } else {
        folder = {
          isDirectory: true,
          path: items[0].path,
          label: key,
          description: items[0].parentPath
        }
      }

      folders.push(folder);
    });

    return folders;
  }

  public getChildren(path: string = '') {
    const list: TreeItem[] = [];

    this.list.forEach(item => {
      const parentPath = Tree.trimPath(path);
      const itemPath = Tree.trimPath(item.label);
      const shortPath = Tree.trimPath(itemPath.replace(parentPath, ''))
      const name = shortPath.split(/[\/\\]/)[0];

      if (itemPath.indexOf(parentPath) === 0) {
        list.push({
          name,
          path: [parentPath, name].join('/'),
          parentPath: parentPath,
          isDirectory: this.hasChildren(itemPath.replace(parentPath, '')),
          ...item
        });
      }
    });

    return this.groupChildren(list);
  }
}