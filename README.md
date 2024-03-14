# tsc-check

基于tsc实现的类型检查工具,支持monorepo

Incremental detection tool based on TSC implementation

## 主要使用场景

在如今的开发构建环境中，往往使用esbuild等非js实现的编译器，他们能带来极速的编译体验。但同时缺点也很明显：缺乏了ts的类型检查，使得ts相关的类型问题会遗留越来越多

常见场景：

1. pre-commit阶段代码增量检查：传统的tsc一般需要全量的检查，比较耗时，这里选择增量检测，就是只检查改变的文件的类型，可结合lint-staged一起使用
2. 命令行单独检查单个文件
3. 流水线上进行代码校验，比如做pr的卡控。检查完毕后才能做代码的合并

## 安装

```shell
npm i tsc-check -D
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
const {check} = require('tsc-check');

const eslintignorePath = path.join(__dirname, '.eslintignore');
module.exports = {
    '**/*.{ts,tsx}': async filenames => {
        const commands = await check({filenames, quiet: true});
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
  "incremental": true, // 参数中加--incremental, 开启增量编译
}
```

## TODO
- [ ] 支持tsc-check.config.json配置文件
- [ ] monorepo，incremental参数支持