import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import { performTSCheck } from './lib/performTSCheck';

interface Command {
    files: string[];
}
export const init = async () => {
    const { version } = await fs.promises
        .readFile(path.join(__dirname, '../', 'package.json'), 'utf8')
        .then(JSON.parse);
    yargs
        .scriptName('tsc-check')
        .version(version)
        .usage('Usage: $0 --files [files...]')
        .options({
            files: {
                alias: 'f',
                describe: 'Files to check',
                type: 'array',
                demandOption: true, // 使得 --files 选项必须提供
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
            (argv) => {
                console.log('files:', argv.files);
                const { files } = argv;
                if (files) {
                    const res = performTSCheck({
                        files,
                    });

                    if (res.error) {
                        console.error(res);
                    }
                }
            }
        )
        .demandCommand(1)
        .strict()
        .parse();
};
