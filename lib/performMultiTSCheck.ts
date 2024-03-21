/**
 * @author liubeijing
 * @fileoverview 批量处理ts检测
 */
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import ts, { type ParsedCommandLine } from 'typescript';
import findUp from 'find-up';

type PerformMultiTSCheckOptions = {
    filenames: string[]; // Files to be compiled
    lintstaged?: boolean; // If true, it means executing in lint-staged
    debug?: boolean; // Whether to enable debug mode
    monorepo?: boolean; // is it a monorepo?
    include?: string[];
};

type CategorizeFilesOptions = Pick<PerformMultiTSCheckOptions, 'filenames'>;
type FilesGroupedByTsconfig = Record<string, string[]>;
type CommandGeneratorOptions = Pick<PerformMultiTSCheckOptions, 'debug' | 'monorepo' | 'include'>;
// 执行脚本
const tscRunnerPath = require.resolve('./lib/tsCompileRunner');

// 缓存解析的配置
const PARSED_CONFIG_CACHE = new Map<string, ParsedCommandLine>();
const parseJsonConfigFileContent = (tsconfigPath: string) => {
    // 有缓存 返回
    if (PARSED_CONFIG_CACHE.has(tsconfigPath)) {
        return PARSED_CONFIG_CACHE.get(tsconfigPath);
    }
    const basePath = path.dirname(tsconfigPath);
    const configFileText = fs.readFileSync(tsconfigPath).toString();
    const result = ts.parseConfigFileTextToJson(tsconfigPath, configFileText);

    const configObject = result.config;
    const parsedConfig = ts.parseJsonConfigFileContent(configObject, ts.sys, basePath);

    PARSED_CONFIG_CACHE.set(tsconfigPath, parsedConfig);
    return parsedConfig;
};
// 判断一个文件是否在指定的tsconfig中
const isInTsConfig = (filePath: string, tsconfigPath: string) => {
    const configParseResult = parseJsonConfigFileContent(tsconfigPath);
    const absoluteFilePath = path.resolve(filePath);
    return configParseResult?.fileNames.includes(absoluteFilePath) || false;
};

// 根据tsconfig.json路径把不同文件进行分类
// 如：
// {
//     'xxx/xxx/tsconfig.json': ['a.ts', 'b.ts']
// }
const categorizeFilesByTsconfig = async ({ filenames }: CategorizeFilesOptions) => {
    const result: FilesGroupedByTsconfig = {};

    for (const filename of filenames) {
        const dir = path.parse(filename).dir;
        // !这里每个文件都要查询匹配一次tsconfig?
        const tsconfigPath = await findUp('tsconfig.json', { cwd: dir });
        if (!tsconfigPath) {
            continue;
        }
        const parsedConfig = parseJsonConfigFileContent(tsconfigPath);
        // 被引用的tsconfig.json路径
        const referencedTsconfigPaths = parsedConfig?.projectReferences?.map((references) => references.path) || [];
        // 在tsconfigPath同级目录下可能还有tsconfig.xxx.json
        const allTsconfigPaths = [tsconfigPath, ...referencedTsconfigPaths];

        // 没有references就在放在传入的tsconfig路径下
        if (!result[tsconfigPath]) {
            result[tsconfigPath] = [];
        }

        // 如果有references, 则判断文件是否包含在references
        if (referencedTsconfigPaths.length > 0) {
            // 拿到到具体命中到那个tsconfig文件
            const matchedTsconfigPath = allTsconfigPaths.find((tsconfigPath) => isInTsConfig(filename, tsconfigPath));

            if (matchedTsconfigPath) {
                if (!result[matchedTsconfigPath]) {
                    result[matchedTsconfigPath] = [];
                }

                result[matchedTsconfigPath].push(filename);
                continue;
            } else {
                result[tsconfigPath].push(filename);
            }
        }

        result[tsconfigPath].push(filename);
    }

    return result;
};

// 生成命令,命令中会执行node ./dist/lib/tscRunner.js 用来在lint-staged中执行
const generateCommands = (result: FilesGroupedByTsconfig, options: CommandGeneratorOptions) => {
    const { debug, include = [], monorepo } = options;
    // 拼接命令
    const commands: string[] = [];
    for (const key in result) {
        // 没有文件不生成
        if (!Object.prototype.hasOwnProperty(key) && result[key].length > 0) {
            const rawCommand = [`node ${tscRunnerPath}`, '--noEmit', `-p ${key}`, `-f ${result[key].join(',')}`];

            if (include?.length > 0) {
                rawCommand.push(`-i ${include.join(',')}`);
            }
            // 开启tsc的模块追踪
            if (debug) {
                rawCommand.push('--debug');
            }

            if (monorepo) {
                rawCommand.push('--monorepo');
            }

            commands.push(rawCommand.join(' '));
        }
    }

    return commands;
};

export const performMultiTSCheck = async (options: PerformMultiTSCheckOptions) => {
    const { filenames, lintstaged = false, debug } = options;
    debug && console.log('tsc-check', filenames);

    const result = await categorizeFilesByTsconfig({ filenames });

    // no files found, throw error
    if (Object.keys(result).length === 0) {
        return !lintstaged
            ? {
                  error: new Error('No tsconfig.json found'),
                  data: null,
              }
            : {
                  error: null,
                  commands: [],
              };
    }
    const commands = generateCommands(result, options);
    // return commands to lint-staged
    if (lintstaged) {
        return {
            error: null,
            commands,
        };
    }

    if (!commands || commands.length === 0) {
        return;
    }

    try {
        const stdout = execSync(commands.join('&&'), { stdio: 'pipe', encoding: 'utf8' });

        if (debug) {
            console.log(stdout);
        }

        if (stdout) {
            return {
                error: stdout,
                data: stdout,
            };
        }

        return {
            error: null,
            data: stdout,
        };
    } catch (error: any) {
        console.error(error.message);
        return {
            error,
            data: null,
        };
    }
};
