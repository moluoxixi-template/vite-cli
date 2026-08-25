# @moluoxixi/create-app

[Chinese](README.md) | **English**

> A project scaffolding CLI built on an atomic layered composition architecture

Browse and try every verified template combination in the [Vite Template Gallery](https://moluoxixi-template.github.io/vite-cli/).

## Quick Start

```bash
# With npx
npx @moluoxixi/create-app

# With pnpm
pnpm create @moluoxixi/app

# With npm
npm create @moluoxixi/app
```

## Features

- **Atomic layered architecture** - Flexible composition through L0/L1/L2 template layers
- **Framework support** - Vue 3 and React 18
- **UI libraries** - Element Plus for Vue and Ant Design for React
- **TypeScript** - Comprehensive type support
- **Routing** - Vue Router and React Router with manual and file-system routing
- **State management** - Pinia for Vue and Zustand for React
- **Internationalization** - Optional vue-i18n and react-i18next support
- **Error monitoring** - Optional Sentry integration
- **Code quality** - Optional ESLint, Commitlint, and Husky
- **Micro-frontends** - Optional qiankun integration

## Roadmap

The following work is planned. Contributions are welcome:

- [ ] **Refactor the Ant Design Vue template** - Improve the ant-design-vue template structure and configuration
- [ ] **Add micro-app support** - Enable it after independent entry points and lifecycle validation are available
- [x] **Refactor the Ant Design template** - The React Ant Design template is available
- [x] **Complete the React generation pipeline** - Standard and qiankun entry points and feature combinations are available
- [x] **Decouple main.ts.ejs** - Improve maintainability by decoupling the Vue entry template
- [x] **Decouple main.tsx.ejs** - Improve maintainability by decoupling the React entry template
- [x] **Decouple vite.config.ts.ejs** - Improve maintainability by decoupling the Vite configuration template

## Bundled Source Code

Every generated project contains the following transparent source code:

| Source directory | Purpose |
|------------------|---------|
| `src/apis/ajax` | Axios-based HTTP request utilities that can be read and modified directly |

Generated projects keep only the public `axios` runtime dependency and no longer depend on the opaque `@moluoxixi/ajax-package` package.

Projects with ESLint enabled also include `@moluoxixi/eslint-config`.

## Source Directory Structure

The project uses a modular architecture that separates business logic from utilities:

```text
src/
|-- commands/              # CLI commands
|   |-- index.ts           # Command exports
|   `-- create.ts          # Create command implementation
|
|-- constants/             # Constants
|   `-- index.ts           # File constants, path constants, and more
|
|-- core/                  # Core business logic
|   |-- index.ts           # Core module exports
|   |-- feature.ts         # Feature discovery, mapping, and rendering
|   |-- capabilities.ts    # Single registry of officially supported capabilities
|   |-- projectConfig.ts   # Configuration normalization and validation
|   |-- projectAtom.ts     # Atom contribution composition by directory order
|   |-- projectOutput.ts   # Final entry files and transparent Vite config
|   |-- prompts.ts         # Interactive configuration prompts
|   `-- template.ts        # Template copying and merging
|
|-- generators/            # Project generators
|   |-- index.ts           # Generator exports
|   `-- project.ts         # Core project generation logic
|
|-- types/                 # TypeScript types
|   |-- index.ts           # Public type exports
|   |-- features.ts        # Feature-related types
|   `-- packageJson.ts     # package.json types
|
|-- utils/                 # Pure utilities without business logic
|   |-- index.ts           # Utility exports
|   |-- deepMerge.ts       # Deep object merging
|   |-- file.ts            # File operations and path handling
|   |-- install.ts         # Dependency installation and Git initialization
|   |-- npmConfig.ts       # npm configuration loading
|   `-- sortDependencies.ts # Dependency sorting
|
|-- index.ts               # CLI entry point
`-- test.ts                # Test script
```

### Directory Responsibilities

- **`commands/`** - Implements CLI commands, user interaction, and flow control
- **`core/`** - Owns feature management, template rendering, and configuration collection
- **`generators/`** - Generates complete projects from normalized configuration
- **`utils/`** - Provides independent, reusable utility functions without business logic
- **`types/`** - Defines TypeScript types for compile-time safety
- **`constants/`** - Centralizes constants and configuration values

### Design Principles

1. **Separation of concerns** - Business logic belongs in `core/`; reusable utilities belong in `utils/`
2. **Modularity** - Every module has a focused responsibility
3. **Type safety** - TypeScript types cover the complete generation pipeline
4. **Extensibility** - Features are discovered from the file system instead of a manually maintained list

## Generated Project Structure

Example output:

```text
my-project/
|-- .husky/                # Git hooks
|-- scripts/               # Build scripts
|-- src/
|   |-- apis/              # API request layer
|   |-- assets/            # Static assets
|   |-- components/        # Shared components
|   |-- constants/         # Constants
|   |-- directives/        # Vue directives
|   |-- layouts/           # Layout components
|   |-- locales/           # Localization files
|   |-- pages/             # Page components
|   |-- router/            # Router configuration
|   |-- stores/            # State management
|   |-- utils/             # Utilities
|   |-- App.vue / App.tsx  # Framework-specific root component
|   `-- main.ts / main.tsx # Framework-specific entry point
|-- .env                   # Environment variables
|-- package.json           # Project configuration
|-- vite.config.ts         # Vite configuration
|-- eslint.config.ts       # Optional ESLint configuration
`-- tsconfig.json          # TypeScript configuration
```

Templates are composed in the following order, with directories acting as capability boundaries:

```text
templates/common/base
  -> templates/<framework>/base
  -> templates/common/features/*
  -> templates/<framework>/features/*
  -> templates/<framework>/micro-frontends/qiankun/base
  -> templates/<framework>/micro-frontends/qiankun/features/*
```

Standard projects contain no qiankun imports, dependencies, or lifecycle code. Qiankun projects can still run independently and support mount, unmount, and remount inside a host application. Both modes produce ordinary `main.ts` / `main.tsx` and `vite.config.ts` files without exposing atoms or internal composition loaders to application code.

## Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Build and package
pnpm build:zip

# Type checking
pnpm type-check

# Linting
pnpm lint:eslint

# Commit changes
pnpm commit
```

## Configuration Options

### Required Options

| Option | Type | Description |
|--------|------|-------------|
| Project name | string | The generated package name |
| Framework | vue / react | The supported frontend framework |
| UI library | element-plus / ant-design | The UI library available for the selected framework |
| Routing mode | manualRoutes / pageRoutes | Manual or file-system routing |
| Package manager | pnpm / npm / yarn | The package manager used by the generated project |

### Optional Features

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| Internationalization | boolean | true | Enables vue-i18n or react-i18next |
| Error monitoring | boolean | false | Enables Sentry integration |
| ESLint | boolean | true | Enables ESLint rules |
| Git hooks | boolean | true | Enables Husky and Commitlint |
| Micro-frontend | boolean | false | Enables qiankun; disabled projects keep a clean standard entry point |

## Development

```bash
# Clone the repository
git clone https://github.com/moluoxixi/create-app.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build
```

## License

MIT

<!-- AIRULES:TRELLIS:START -->

## Trellis Workflow

This project uses Trellis to manage AI-assisted development. When working in this repository with an AI coding assistant, you can use prompts such as:

```text
Use Trellis to start this task: <describe the task>
Use Trellis to continue the current task.
Use Trellis to check the current changes.
Use Trellis to finish this work session.
```

The AI assistant selects the available command or skill for the current host. Workflow, task, and specification state is stored under `.trellis/`.

Place interface documentation, business requirements, and other source material in `.trellis/knowledge/sources/`. On every turn, the AI checks for changes, organizes sources by domain and stable entity under `.trellis/knowledge/library/`, and updates `.trellis/knowledge/index.md`. It asks questions only when ambiguity would materially affect the result.

<!-- AIRULES:TRELLIS:END -->
