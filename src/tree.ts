import * as lodash from 'lodash';
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
  private list!: ProjectInQuickPickList;

  constructor (list: ProjectInQuickPickList) {
    this.list = list;
  }

  static trimPath (path) {
    let trimPatten = /(^[\.,\\\/\$\~]*|[\.\/\\]*$)/ig;

    return path.replace(trimPatten, '');
  }

  public getChildren(path: string = '') {
    let list: TreeItem[] = [];

    this.list.forEach(item => {
      let parentPath = Tree.trimPath(path);
      let itemPath = Tree.trimPath(item.label);
      let shortPath = Tree.trimPath(itemPath.replace(parentPath, ''))
      let name = shortPath.split(/[\/\\]/)[0];

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

    let group = lodash.groupBy(list, 'name');
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

  hasChildren(path) {
    return Tree.trimPath(path).split(/\/\\/).length > 1;
  }
}