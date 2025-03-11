# Plugin Development Template

## Introduction

This plugin uses a template that automates the development and publication processes on GitHub, including releases.  
You can develop inside .obsidian>plugins folder or from another folder.  
Important: if you develop from another folder, you need to fill the `.env` file with the paths to your vaults.

### Environment Setup

#### File Structure

- `main.ts` must in the src folder
- `styles.css` can be in the src folder or root folder

#### Development Options

0. **First install yarn:** `npm install -g yarn`

1. **Inside the vault's plugins folder:**
   - Delete the `.env` file or put empty paths.

2. **From another folder:**
   - Set the vault paths in the `.env` file:
     - `TestVault` for development
     - `RealVault` for production simulation
   - Necessary files will be automatically copied to the targeted vault

### Available Commands

- `yarn start`: Opens VS Code, runs `yarn install`, then `yarn dev`
- `yarn dev`: For development
- `yarn build`: Builds the project
- `yarn real`: Simulates a traditional plugin installation in your REAL vault
- `yarn bacp`: Builds, adds, commits, and pushes (prompts for commit message)
- `yarn acp`: Adds, commits, and pushes (without building)
- `yarn version`: Updates version, modifies relevant files, then adds, commits, and pushes
- `yarn release`: Creates a GitHub release (prompts for release title, can be multiline using `\n`)
- `yarn lint`: Lints the project
- `yarn lint:fix`: Fixes linting issues

### Recommended Workflow

1. `yarn start`
2. `yarn bacp`
3. `yarn version`
4. `yarn release`

### Additional Features

- **obsidian-typings**: This template automatically includes obsidian-typings, providing access to additional types not present in the official API.

### SASS Support (need to be reviewed)

For SASS support, check out the `sass-ready` branch in the original template repository. 
When you are using the template for this branch, you need to check use all branchs option. then after you clone your new plugin, there is a batch in the root folder to replace the master branch by sass-ready one. run this once