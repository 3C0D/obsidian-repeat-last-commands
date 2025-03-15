# Repeat Last Commands

An Obsidian plugin that enhances your workflow by allowing you to quickly repeat your most recently used commands.

## Features

- **Repeat Last Command**: Quickly execute the most recently used command
- **Repeat Last Commands**: Access your recent command history in a menu
- **Command Aliases**: Create custom names for frequently used commands (manageable in settings)
- **Command Exclusions**: Hide/show specific commands from the command palette (manageable in settings)
- **Keyboard Shortcuts**: Quickly configure shortcuts for commands directly from the palette

## How to Use

### Basic Commands

- **Repeat Last Command**: Execute your most recently used command
- **Repeat Commands**: Open a modal with your command history to select from
- **Copy Command ID**: Copy the ID of the last executed command to clipboard

### Command Aliases

1. Open the command palette
2. Press `Ctrl+A` (or your configured shortcut) when a command is selected
3. Enter an alias name for the command
4. The command will now appear with your custom name in the command palette
5. You can manage all your aliases from the plugin settings

### Excluding Commands

1. Open the command palette
2. Press `Ctrl+P` (or your configured shortcut) when a command is selected
3. The command will be hidden from the command palette
4. To manage excluded commands, visit the plugin settings

## Settings

Each setting below will appear if you have created aliases or hidden commands:

- **Command Aliases**: View and manage your custom command aliases
  - Shows commands with custom names you've created
  - You can remove aliases to restore original command names

- **Hidden Commands**: View and manage commands you've hidden from the command palette
  - Shows commands you've excluded from the command palette
  - You can restore hidden commands to make them visible again

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Repeat Last Commands"
4. Install the plugin and enable it

## Manual Installation

1. Download the latest release from the [releases page](https://github.com/3C0D/obsidian-repeat-last-commands/releases)
2. Extract the zip file to your Obsidian plugins folder: `<vault>/.obsidian/plugins/`
3. Enable the plugin in Obsidian settings

## Support

If you encounter any issues or have suggestions for improvements, please [open an issue](https://github.com/3C0D/obsidian-repeat-last-commands/issues) on GitHub.

## License

This project is licensed under the MIT License.

## Development Environment Setup

### File Structure

- `main.ts` must be in the src folder
- `styles.css` can be in the src folder or root folder

### Development Options

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
- `yarn v` or `yarn update-version`: Updates version, modifies relevant files, then adds, commits, and pushes
- `yarn release`: Creates a GitHub release (prompts for release title, can be multiline using `\n`)
- `yarn lint`: Lints the project
- `yarn lint:fix`: Fixes linting issues

### Recommended Workflow

1. `yarn start`
2. `yarn bacp`
3. `yarn v` (or `yarn update-version`)
4. `yarn r` (or `yarn release`)

### Additional Features

- **obsidian-typings**: This template automatically includes obsidian-typings, providing access to additional types not present in the official API.