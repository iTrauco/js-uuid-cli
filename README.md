# readme.md

## uuidd-cli
a lightweight node tool to aid in code based software engineering software artifact development and review. 

```
project-structure/
├── index.js           # Main entry point
├── lib/
│   ├── config.js      # Configuration handling
│   ├── git-utils.js   # Git operations
│   ├── file-processor.js # Processing files
│   ├── backup-manager.js # Backup and rollback functionality 
│   └── cli.js         # Command-line interface
└── package.json
```# UUID CLI Tool

A command-line tool for adding UUIDs and metadata to JavaScript files.

## Features

- Adds UUIDs to each line of JavaScript files
- Includes Git branch information
- Includes Git commit information
- Includes timestamps
- Supports excluding directories
- Provides rollback functionality

## Installation

```bash
npm install -g uuid-cli
```

Or run it directly from the cloned repository:

```bash
git clone <repository-url>
cd uuid-cli
npm install
npm link
```

## Usage

### Interactive Mode

Run the tool without arguments to start in interactive mode:

```bash
uuid-cli
```

### Command Line Arguments

Run directly:

```bash
uuid-cli --run
```

Rollback the last run:

```bash
uuid-cli --rollback
```

Exclude a directory:

```bash
uuid-cli --exclude directory-name
```

List excluded directories:

```bash
uuid-cli --list-exclude
```

## Configuration

Configuration is stored in `.uuid-cli-config.json` in the current directory. The file contains:

- User preferences
- List of excluded directories
- Last run information for rollback