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
    public pop(): string {
        return this.stack.pop();
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