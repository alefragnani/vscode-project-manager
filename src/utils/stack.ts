/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

export class Stack {

    private items: string[] = [];

    public fromString(input: string) {
        if (input !== "") {
            this.items = JSON.parse(input);
        }
    }

    public toString(): string {
        return JSON.stringify(this.items);
    }

    public push(item: string) {
        const index: number = this.items.indexOf(item);
        if (index > -1) {
            this.items.splice(index, 1);
        }
        this.items.push(item);
    }

    public pop(item?: string): string {
        if (!item) {
            return this.items.pop();
        } else {
            for (let index = 0; index < this.items.length; index++) {
                const element = this.items[ index ];
                if (element === item) {
                    return this.items.splice(index, 1)[ 0 ];
                }
            }
        }
    }

    public rename(oldItem: string, newItem: string): void {
        for (let index = 0; index < this.items.length; index++) {
            if (this.items[index] === oldItem) {
                this.items[index] = newItem;
            }
        }
    }

    public length(): number {
        return this.items.length;
    }

    public getItem(index: number): string {
        if (index < 0) {
            return "";
        }

        if (this.items.length === 0) {
            return "";
        }

        return this.items[ index ];
    }
}
