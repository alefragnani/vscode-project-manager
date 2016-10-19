import {StringStack} from './stack';

export class ProjectsSorter {
    
    public static getSortedByName(items: any[]): any[] {
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

    public static getSortedByPath(items: any[]): any[] {
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
    
    public static getSortedByRecent(items: any[], aStack: StringStack): any[] {
        
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
    
    /**
		 * Show an information message.
		 *
		 * @see [showInformationMessage](#window.showInformationMessage)
		 *
		 * @param (string) itemsToShow The message to show.
		 * @param criteria A set of items that will be rendered as actions in the message.
		 * @param aStack A set of items that will be rendered as actions in the message.
		 * @return Sorted list
		 */
    public static SortItemsByCriteria(itemsToShow, criteria: string, aStack: StringStack) {
        let newItemsSorted = []
        switch (criteria) {
            case 'Path':
                newItemsSorted = this.getSortedByPath(itemsToShow); 
                break;
        
            case 'Saved': 
                newItemsSorted = itemsToShow;
                break;
                
            case 'Recent':
                newItemsSorted = this.getSortedByRecent(itemsToShow, aStack);
                break;
                
            default:
                newItemsSorted = this.getSortedByName(itemsToShow);
                break;
        }
        return newItemsSorted;
    }
}