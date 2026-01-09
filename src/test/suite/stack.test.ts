/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the GPLv3 License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// import * as vscode from "vscode";
import * as myStack from "../../utils/stack";

// Defines a Mocha test suite to group tests of similar kind together
suite("Stack Tests", () => {
    
    let stack: myStack.Stack;
    
    setup( () => {
        stack = new myStack.Stack();        
    });

    // Defines a Mocha unit test
    test("Something 1", () => {
        assert.equal(-1, [1, 2, 3].indexOf(5));
        assert.equal(-1, [1, 2, 3].indexOf(0));
    });
    
    test("Stack should start empty", () => {
        assert.equal(stack.length(), 0);
    });

    test("Stack should have one item after adding one", () => {
        stack.push("item 0");
        assert.equal(stack.length(), 1);
    });

    test("Stack should have two items after adding two different items", () => {
        stack.push("item 0");
        stack.push("item 1");
        assert.equal(stack.length(), 2);
    });

    test("Stack should have on item after adding two equal items", () => {
        stack.push("item 0");
        stack.push("item 0");
        assert.equal(stack.length(), 1);
    });

    test("Should rename an item in the stack", () => {
        stack.push("item 0");
        stack.push("item 1");
        stack.rename("item 0", "item 0 renamed");
        assert.equal(stack.getItem(0), "item 0 renamed");
        assert.equal(stack.getItem(1), "item 1");
    });
});