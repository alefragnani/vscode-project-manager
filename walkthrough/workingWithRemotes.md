## Working with Remotes

The extension support [Remote Development](https://code.visualstudio.com/docs/remote/remote-overview) scenarios, and you may choose how to use it, depending on your needs

### I access Remotes, but most of my work is Local

This is the _regular_ scenario, and that's why you don't need to do anything special for the extension to work. It works out of the box.

When installed locally, you can save any Container, SSH, WSL or Codespaces projects as Favorites. Each one will have its own icon to be properly identified, and when you select them, VS Code will open the remote automatically.

_It just works_

### But what if I do most of my work on Remotes

If you normally connect to remotes (like SSH/WSL) and would like to save Favorite projects on that remote, or to be able to auto-detect repos located on that remote, you must activate/install the extension to work on remotes. 

You just have to add the lines below on your `User Settings`.

```json
    "remote.extensionKind": {
        "alefragnani.project-manager": [
            "workspace"
        ]
    },
```

> More details on [VS Code documentation](https://code.visualstudio.com/docs/remote/containers#_advanced-forcing-an-extension-to-run-locally-or-remotely)