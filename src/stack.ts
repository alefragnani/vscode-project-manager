/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export class StringStack {
    
    private stack: string[] = [];
    
    /**
     * fromString
     */
    public fromString(input: string) {
        if (input !== "") {
            this.stack = JSON.parse(input);
        }
    }
    
    /**
     * toString
     */
    public toString(): string {
        return JSON.stringify(this.stack);
    }
    
    /**
     * push
     */
    public push(item: string) {
        const index: number = this.stack.indexOf(item);
        if (index > -1) {
            this.stack.splice(index, 1);
        }
        this.stack.push(item);
    }
    
    /**
     * pop
     */
    public pop(item?: string): string {
        if (!item) {
            return this.stack.pop();
        } else {
            for (let index = 0; index < this.stack.length; index++) {
                const element = this.stack[index];
                if (element === item) {
                    return this.stack.splice(index, 1)[0];
                }
            }
        }
    }

    /**
     * Rename an item in the stack
     * @param oldItem string
     * @param newItem string
     */
    public rename(oldItem: string, newItem: string): void {
        for (let iterator of this.stack) {
            if (iterator === oldItem) {
                iterator = newItem;
            }
        }
    }

    /**
     * length
     */
    public length(): number {
        return this.stack.length;        
    }
    
    /**
     * getItem
     */
    public getItem(index: number): string {
        if (index < 0) {
            return "";            
        }
        
        if (this.stack.length === 0) {
            return "";            
        }
        
        return this.stack[index];
    }
}