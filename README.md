# delta-tsc-check

[English Documentation](README.md) | [中文文档](README.zh.md)

Incremental detection tool based on TSC implementation

## Background

In modern development and build environments, developers often adopt compilers not implemented in JavaScript, such as esbuild, to improve compilation speed and efficiency. While these tools indeed provide a lightning-fast compilation experience, they typically lack TypeScript (TS) type checking capabilities. This means TypeScript type-related errors may not be caught during the compilation stage, potentially leading to an accumulation of type issues in the codebase.

To address this pain point, the `tsc-check` tool was created. It focuses on providing fast, incremental TypeScript type checking to ensure all type errors are caught before code commits or merges.

## Key Scenarios

1. **Incremental code checking during the pre-commit stage**：

    - Before committing code, use `tsc-check` for incremental checking, which only checks the types of changed files. This significantly reduces the time spent checking while ensuring each commit is type-safe.
    - Used in combination with `lint-staged`, `tsc-check` can be run automatically during the commit stage to ensure code quality.

2. **Command-line individual file check**：
    - During development, developers may need to type-check a single file to verify its type correctness. With `tsc-check`, it is easy to perform type checking on a single file.。
3. **Code validation on the pipeline:**：
    - Before code merging or release, a series of code validations are usually required to ensure code quality. `tsc-check` can be used as a step on the pipeline to perform type checking.
    - If type errors are discovered on the pipeline, it can prevent the code from being merged or released, thus ensuring the stability of the codebase.

## Installation

```shell
npm i delta-tsc-check -D
```

## Usage

1. Command line

```shell
npx tsc-check --files a.ts b.ts --config tsc-check.config.json

```

2. Combined with lint-staged The API version is as follows, and the CLI version is described in the CLI section below

```js
// lint-staged.config.cjs
const path = require('path');
const { performMultiTSCheck } = require('delta-tsc-check');

const eslintignorePath = path.join(__dirname, '.eslintignore');
module.exports = {
    '**/*.{ts,tsx}': async (filenames) => {
        // Generate tsc-related execution commands
        const { commands = [] } = await performMultiTSCheck({ filenames, lintstaged: true });
        // Other commands such as eslint
        commands.push(`prettier ${filenames.join(' ')} --write`);
        commands.push(`eslint --ignore-path ${eslintignorePath} ${filenames.join(' ')} --fix --quiet --cache`);
        return commands;
    },
};
```

3. Configuration file (to be completed)

The configuration file is named tsc-check.config.json, which can mainly be used to configure

```js
// tsc-check.config.json
{
  "include": [], // Generally global declaration files. Refer to the include field of tsconfig.json
  "debug": true, // Debugging mode
  "monorepo": true, // Whether it is a monorepo
}
```

## Node API

**Usage instructions for the performMultiTSCheck API**

`performMultiTSCheck` is a function that executes multiple TypeScript checks within the lint-staged hook. This function belongs to the delta-tsc-check library, which allows you to run the TypeScript compiler (tsc) to check for type errors when code changes and compiles only changed files for improved performance.

### Function Signature

```javascript
import { performMultiTSCheck } from 'delta-tsc-check';

// 函数签名
async function performMultiTSCheck({
    filenames
    lintstaged = false
    debug = false
    include = []
}): Promise<{ commands?: string[], error: Error }> {
  // ...
}
```

### Parameters

-   **filenames** (`string[]`): An array of filenames that need TypeScript checking.
-   **lintstaged** (`boolean`): Whether to run in a lint-staged environment. If true, the function will return a command array compatible with lint-staged.
-   **debug**: Whether to enable debug mode, default is false.
-   **include**: Files to be included such as ts/tsx/d.ts, generally global declaration files, refer to the functionality of tsconfig.include.

### Return Value

-   **Promise<{ commands?: string[],error: Error }>**: Returns a Promise that resolves to an object containing `commands` and `error` properties. `commands` is an array of strings that includes the commands to be executed.

## CLI

**Usage instructions for the tsc-check**

`tsc-check` is a command-line tool for performing type checking with the TypeScript compiler (tsc), and it can be integrated with lint-staged to perform type checking only on changed files. It offers several options to customize the execution behavior.

### Command Format

```bash
tsc-check [options]
```

### Available Options

-   **--files, -f**

    -   **Description**：Specifies the files to check. This is a required option.
    -   **Type**：Array (multiple files or directories can be specified).
    -   **Example**：`--files src/index.ts

-   **--debug, -d**
    -   **Description**：Enables debug mode. This will output additional debugging information.
    -   **Type**：Boolean (true/false).
    -   **示Example例**：`--debug`
-   ~~**--lintstaged, -l**~~
    -   ~~**Description**：Executes in the `lint-staged` environment. This will adjust the command's output and behavior to be compatible with `lint-staged`.~~
    -   ~~**Type**：Boolean (true/false).~~
    -   ~~**Example**：`--lintstaged`~~

### Usage Examples

1. **Check a single file**

```bash
tsc-check --files myfile.ts
```

2. **Check multiple files**

```bash
tsc-check --files file1.ts file2.ts
```

3. **Use in lint-staged**

If you have used `tsc-check` in your `lint-staged` configuration, you can specify the options like this:

```json
{
    - "*.{ts,tsx}": ["tsc-check --lintstaged --files"]
    + "*.{ts,tsx}": ["tsc-check --files"]
}
```

4. **Enable debug mode**

```bash
tsc-check --files myfile.ts --debug
```

## TODO

-   [ ] Support for tsc-check.config.json configuration file
-   [ ] Support glob patterns with --files option
