import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import { performMultiTSCheck } from './lib/perform-multi-tsc';
import { globSync } from 'glob';

const toAbsolutePath = (filePath: string) => {
    // Check if the path is already an absolute path
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    // Convert relative path to absolute path
    return path.resolve(filePath);
};
interface Command {
    files: string[]; // Files to be compiled
    debug: boolean; // Whether to enable debug mode
    lintstaged: boolean; // If true, it means executing in lint-staged
    monorepo: boolean; // 是否是monorepo 暂时没啥用
}
export const init = async () => {
    const { version } = await fs.promises
        .readFile(path.join(__dirname, '../', 'package.json'), 'utf8')
        .then(JSON.parse);
    yargs
        .scriptName('tsc-check')
        .version(version)
        .usage('Usage: $0 --files [files...] --debug')
        .options({
            files: {
                alias: 'f',
                describe: 'Files to check',
                type: 'array',
                demandOption: true, // 使得 --files 选项必须提供
            },
            debug: {
                alias: 'd',
                describe: 'enable debug',
                type: 'boolean',
                demandOption: false, // 非必选
            },
            // lintstaged: {
            //     alias: 'l',
            //     describe: 'Execute in lint-staged',
            //     type: 'boolean',
            //     demandOption: false, // 非必选
            // },
            monorepo: {
                alias: 'm',
                describle: 'Is it a monorepo?',
            },
        })
        .command<Command>(
            '$0',
            'Perform TypeScript check',
            (yargs) => {
                return yargs.positional('files', {
                    describe: 'Files to check',
                    type: 'string',
                });
            },
            async (argv) => {
                const { files, debug, lintstaged, monorepo } = argv;

                const globFiles = files.reduce<string[]>((result, file) => {
                    const absolutePath = toAbsolutePath(file);
                    const matches = globSync(absolutePath);
                    result.push(...matches);

                    return result;
                }, []);

                if (debug) {
                    console.log('files:', argv.files, argv);
                    console.log('globFiles', globFiles);
                }

                if (files) {
                    await performMultiTSCheck({
                        filenames: files.map((file) => toAbsolutePath(file)),
                        debug,
                        lintstaged,
                        monorepo,
                    });

                    console.log('\x1b[32m%s\x1b[0m', 'tsc check success!');

                    // 这里是所有错误上报的入口，内部的错误会先捕获返回到这里再抛出
                    // if (res?.error) {
                    //     const err = res.error;
                    //     throw new Error(err.stdout || err);
                    // }
                }
            }
        )
        .demandCommand(1)
        .strict()
        .showHelpOnFail(false)
        .parse();
};
