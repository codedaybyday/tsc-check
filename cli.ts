import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import { performMultiTSCheck } from './lib/performMultiTSCheck';

const toAbsolutePath = (filePath: string) => {
    // Check if the path is already an absolute path
    if (path.isAbsolute(filePath)) {
        return filePath;
    }
    // Convert relative path to absolute path
    return path.resolve(filePath);
};
interface Command {
    files: string[];
    debug: boolean;
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
                const { files, debug } = argv;
                debug && console.log('files:', argv.files, argv);
                if (files) {
                    const res = await performMultiTSCheck({
                        filenames: files.map((file) => toAbsolutePath(file)),
                        debug,
                        // quiet ?
                    });

                    if (!res?.error) {
                        console.log('\x1b[32m%s\x1b[0m', 'tsc check success!');
                    }

                    if (res?.error) {
                        const stderr = res.error?.stderr?.toString('utf8');
                        const stdout = res.error?.stdout?.toString('utf8');

                        if (stderr) {
                            console.error('\x1b[31m%s\x1b[0m', 'tsc-check stderr:');
                            console.error(stderr);
                        }

                        if (stdout) {
                            console.log('\x1b[31m%s\x1b[0m', 'tsc-check stdout:');
                            console.log(stdout);
                        }
                    }
                }
            }
        )
        .demandCommand(1)
        .strict()
        .parse();
};
