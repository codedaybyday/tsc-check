# delta-tsc-check

[English Documentation](README.md) | [中文文档](README.zh.md)

基于tsc实现的增量类型检查工具,支持monorepo

Incremental detection tool based on TSC implementation

## 背景

在现代化的开发构建环境中，为了提高编译速度和效率，开发者们经常采用如esbuild等非JavaScript实现的编译器。这些工具的确提供了飞一般的编译体验，但与此同时，它们通常不包含TypeScript（TS）的类型检查功能。这意味着TypeScript的类型相关错误可能无法在编译阶段被捕获，从而可能导致越来越多的类型问题遗留在代码中。

为了解决这一痛点，`tsc-check` 工具应运而生。它专注于提供快速、增量的TypeScript类型检查，确保在代码提交或合并前捕获所有类型错误。

## 主要场景

1. **pre-commit 阶段代码增量检查**：

    - 在提交代码前，使用 `tsc-check` 进行增量检查，即仅对发生变更的文件进行类型检查。这大大减少了检查的时间，同时确保每次提交的代码都是类型安全的。
    - 结合 `lint-staged` 使用，可以在提交阶段自动运行 `tsc-check`，确保代码质量。

2. **命令行单独检查单个文件**：
    - 在开发过程中，开发者可能需要对单个文件进行类型检查，以验证其类型正确性。通过 `tsc-check`，可以轻松地对单个文件进行类型检查。
3. **流水线上进行代码校验**：
    - 在代码合并或发布前，通常需要进行一系列的代码校验，以确保代码的质量。`tsc-check` 可以作为流水线上的一个步骤，对代码进行类型检查。
    - 如果在流水线上发现类型错误，可以阻止代码的合并或发布，从而确保代码库的稳定性。

## 安装

```shell
npm i delta-tsc-check -D
```

## 使用

1. 命令行

```shell
npx tsc-check --files a.ts b.ts --config tsc-check.config.json

```

2. 结合lint-staged
   api版本如下，cli版本下面cli的说明部分

```js
// lint-staged.config.cjs
const path = require('path');
const { performMultiTSCheck } = require('delta-tsc-check');

const eslintignorePath = path.join(__dirname, '.eslintignore');
module.exports = {
    '**/*.{ts,tsx}': async (filenames) => {
        // 生成tsc相关的执行命令
        const { commands = [] } = await performMultiTSCheck({ filenames, lintstaged: true });
        // 其他命令 如eslint
        commands.push(`prettier ${filenames.join(' ')} --write`);
        commands.push(`eslint --ignore-path ${eslintignorePath} ${filenames.join(' ')} --fix --quiet --cache`);
        return commands;
    },
};
```

3. 配置文件(待完成)

配置文件名固定为tsc-check.config.json,主要可以用来配置

```js
// tsc-check.config.json
{
  "include": [], // 一般是全局的声明文件。参考tsconfig.json include字段
  "debug": true, // 调试开头
  "monorepo": true, // 是否是个monorepo
}
```

## Node API

**performMultiTSCheck API 使用说明**

`performMultiTSCheck` 是一个函数，它用于在lint-staged钩子中执行多个TypeScript检查。该函数属于`delta-tsc-check`库，该库允许你在代码变更时运行TypeScript编译器（tsc）以检查类型错误，并仅对更改的文件进行编译，从而提高性能。

### 函数签名

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

### 参数

-   **filenames** (`string[]`): 需要进行TypeScript检查的文件名数组。
-   **lintstaged** (`boolean`): 是否在lint-staged环境中运行。如果是，则函数会返回与lint-staged兼容的命令数组。
-   **debug**: 是否开始debug模式，默认为false
-   **include**: 需要包含进来的ts/tsx/d.ts文件，一般是全局声明文件,参考tsconfig.include的功能

### 返回值

-   **Promise<{ commands?: string[],error: Error }>**: 返回一个Promise，解析后得到一个对象，该对象包含`commands`和`error`属性。`commands`是一个字符串数组，包含了要执行的命令。

## CLI

**使用说明：tsc-check 命令**

`tsc-check` 是一个命令行工具，用于执行 TypeScript 编译器（tsc）的类型检查，并且可以与 lint-staged 集成，以仅对变更的文件进行类型检查。它提供了几个选项来定制执行行为。

### 命令格式

```bash
tsc-check [options]
```

### 可用选项

-   **--files, -f**

    -   **描述**：指定要检查的文件。这是必需的选项。
    -   **类型**：数组（可以指定多个文件或目录）。
    -   **示例**：`--files src/index.ts

-   **--debug, -d**
    -   **描述**：启用调试模式。这将输出额外的调试信息。
    -   **类型**：布尔值（true/false）。
    -   **示例**：`--debug`
-   ~~- -lintstaged, -l~~
    -   ~~描述：在 lint-staged 环境中执行。这将调整命令的输出和行为，以与 lint-staged 兼容。~~
    -   ~~类型：布尔值（true/false）。~~
    -   ~~示例：`--lintstaged`~~

### 使用示例

1. **检查单个文件**

```bash
tsc-check --files myfile.ts
```

2. **检查多个文件**

```bash
tsc-check --files file1.ts file2.ts
```

3. **在 lint-staged 中使用**

如果你在 `lint-staged` 配置中使用了 `tsc-check`，你可以这样指定选项：

```diff
{
    - "*.{ts,tsx}": ["tsc-check --lintstaged --files"]
    + "*.{ts,tsx}": ["tsc-check --files"]
}
```

4. **启用调试模式**

```bash
tsc-check --files myfile.ts --debug
```

## TODO

-   [ ] 支持tsc-check.config.json配置文件
-   [ x ] --files参数支持glob
