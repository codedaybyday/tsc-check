/**
 * @author liubeijing
 * @fileoverview 批量处理ts检测
 */
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import ts, { type ParsedCommandLine } from 'typescript';
import findUp from 'find-up';

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

type FilesGroupedByTsconfig = Record<string, string[]>;
// 根据tsconfig.json路径把不同文件进行分类
// 如：
// {
//     'xxx/xxx/tsconfig.json': ['a.ts', 'b.ts']
// }
const classifyFilesByTsconfigPath = async (filenames: string[]) => {
    const result: FilesGroupedByTsconfig = {};

    for (const filename of filenames) {
        const dir = path.parse(filename).dir;
        // !这里每个文件都要查询匹配一次tsconfig?
        const tsconfigPath = await findUp('tsconfig.json', { cwd: dir });
        console.log(222, tsconfigPath);
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

// !这几个参数是否有必要？
interface CommandGeneratorOptions {
    debug?: boolean;
    trace?: boolean;
    keepTmp?: boolean;
    include?: string[];
}
// 生成命令
const generateCommands = (result: FilesGroupedByTsconfig, options: CommandGeneratorOptions) => {
    const { debug, trace, keepTmp, include = [] } = options;
    // 拼接命令
    const commands = [];
    for (const key in result) {
        // 没有文件不生成
        if (!Object.prototype.hasOwnProperty(key) && result[key].length > 0) {
            const rawCommand = [`node ${tscRunnerPath}`, '--noEmit', `-p ${key}`, `-f ${result[key].join(',')}`];

            if (include?.length > 0) {
                rawCommand.push(`-i ${include.join(',')}`);
            }
            // 开启tsc的模块追踪
            if (trace) {
                rawCommand.push('--traceResolution');
            }
            // 删除临时文件
            if (keepTmp) {
                rawCommand.push('--keepTmp');
            }

            if (debug) {
                rawCommand.push('--debug');
            }

            // if (hash) {
            //     rawCommand.push(`--hash ${hash(key)}`);
            // }
            commands.push(rawCommand.join(' '));
        }
    }

    return commands;
};

type PerformMultiTSCheckOptions = {
    filenames: string[]; // 需要进行 TypeScript 检查的文件列表
    quiet?: boolean; // 是否为安静模式，安静模式下只返回命令，不执行
    debug?: boolean; // 是否为调试模式，调试模式下会打印出调试信息
};

export const performMultiTSCheck = async (options: PerformMultiTSCheckOptions) => {
    const { filenames, quiet = false, debug } = options;
    debug && console.log('tsc-check', filenames);

    const result = await classifyFilesByTsconfigPath(filenames);

    // no files found, throw error
    if (Object.keys(result).length === 0) {
        return !quiet
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
    if (quiet) {
        return {
            error: null,
            commands,
        };
    }

    if (!commands || commands.length === 0) {
        return;
    }

    try {
        const stdout = execSync(commands.join('&&'));
        if (debug) {
            console.log(stdout.toString('utf8'));
        }

        return {
            error: null,
            data: stdout,
        };
    } catch (error: any) {
        return {
            error,
            data: null,
        };
    }
};
