# delta-tsc-check

基于tsc实现的增量类型检查工具,支持monorepo

Incremental detection tool based on TSC implementation

## 主要使用场景

在如今的开发构建环境中，往往使用esbuild等非js实现的编译器，他们能带来极速的编译体验。但同时缺点也很明显：缺乏了ts的类型检查，使得ts相关的类型问题会遗留越来越多

常见场景：

1. pre-commit阶段代码增量检查：传统的tsc一般需要全量的检查，比较耗时，这里选择增量检测，就是只检查改变的文件的类型，可结合lint-staged一起使用
2. 命令行单独检查单个文件
3. 流水线上进行代码校验，比如做pr的卡控。检查完毕后才能做代码的合并

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

```js
// lint-staged.config.cjs
const path = require('path');
import {performMultiTSCheck} from 'delta-tsc-check';

const eslintignorePath = path.join(__dirname, '.eslintignore');
module.exports = {
    '**/*.{ts,tsx}': async filenames => {
        // 生成tsc相关的执行命令
        const {commands = []} = await performMultiTSCheck({filenames, lintstaged: true});
        // 其他命令 如eslint
        commands.push(`prettier ${filenames.join(' ')} --write`);
        commands.push(`eslint --ignore-path ${eslintignorePath} ${filenames.join(' ')} --fix --quiet --cache`);
        return commands;
    }
};

```

3. 配置文件

配置文件名固定为tsc-check.config.json,主要可以用来配置
```js
// tsc-check.config.json
{
  "include": [], // 一般是全局的声明文件。参考tsconfig.json中comilperOptions.include字段
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
    filenames, // 要检查的文件名数组
    lintstaged = false, // 是否在lint-staged中使用，默认为false
    debug = false, // 是否开始debug模式，默认为false
    include = [], // 需要包含进来的ts/tsx/d.ts文件，一般是全局声明文件
}): Promise<{ commands?: string[], error: Error }> {
  // ...
}

### 参数

- **filenames** (`string[]`): 需要进行TypeScript检查的文件名数组。
- **lintstaged** (`boolean`): 是否在lint-staged环境中运行。如果是，则函数会返回与lint-staged兼容的命令数组。
- **debug**: 是否开始debug模式，默认为false
- **include**: 需要包含进来的ts/tsx/d.ts文件，一般是全局声明文件,参考tsconfig.include的功能

### 返回值

- **Promise<{ commands?: string[],err: Error }>**: 返回一个Promise，解析后得到一个对象，该对象包含`commands`和`error`属性。`commands`是一个字符串数组，包含了要执行的命令。

## TODO
- [ ] 支持tsc-check.config.json配置文件
- [ ] monorepo，incremental参数支持