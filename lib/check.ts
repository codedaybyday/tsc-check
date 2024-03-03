#!/usr/bin/env node

import { spawnSync } from 'child_process';
import fs from 'fs';
import { dirname, join, resolve } from 'path';
import json5 from 'json5';

const resolveFromModule = (moduleName: string, ...paths: string[]): string => {
    const modulePath = dirname(require.resolve(`${moduleName}/package.json`));
    return join(modulePath, ...paths);
};

const resolveFromRoot = (...paths: string[]): string => {
    return join(process.cwd(), ...paths);
};

interface CheckOptions {
    files: string[];
    tsconfigFilePath?: string; // tsconfig.json的路径
    configFilePath?: string; // tsc-check.config.json路径
}

interface TmpTsconfigCreatorOptions {
    tsconfigFilePath?: string;
    files: string[];
}

const createTmpTsconfig = ({
    tsconfigFilePath,
    files,
}: TmpTsconfigCreatorOptions) => {
    const tsconfigPath = tsconfigFilePath || resolveFromRoot('tsconfig.json');
    const tsconfigContent = fs.readFileSync(tsconfigPath).toString();
    const tsconfig = json5.parse(tsconfigContent); // 解析成对象, 用json5
    // 生成一个临时
    const tmpTsconfigFileName = 'tsconfig.tmp.json';
    // 传了tsconfig文件就在所在文件的目录在生成临时文件，否则就在根目录下生成
    const tmpTsconfigPath = tsconfigFilePath
        ? resolve(dirname(tsconfigFilePath), tmpTsconfigFileName)
        : resolveFromRoot(tmpTsconfigFileName);

    const tmpTsconfig = {
        ...tsconfig,
        compilerOptions: {
            ...tsconfig.compilerOptions,
            skipLibCheck: true,
        },
        files,
        include: [],
        references: [],
    };
    // 把内容写入到临时文件
    fs.writeFileSync(tmpTsconfigPath, JSON.stringify(tmpTsconfig, null, 2));

    return tmpTsconfigPath;
};

export const check = ({
    files, // 变化的文件列表
    tsconfigFilePath, // tsconfig文件路径
    configFilePath, // tsc-check的配置文件
}: CheckOptions) => {
    const tmpTsconfigPath = createTmpTsconfig({ tsconfigFilePath, files });

    const spawnArgs = ['-p', tmpTsconfigPath, '--noEmit', '--incremental'];
    const tscFile = process.versions.pnp
        ? 'tsc'
        : resolveFromModule(
              'typescript',
              `../.bin/tsc${process.platform === 'win32' ? '.cmd' : ''}`
          );
    const { status } = spawnSync(tscFile, spawnArgs, { stdio: 'inherit' });

    // 结束后清除临时配置文件
    fs.unlinkSync(tmpTsconfigPath);

    return status;
};
