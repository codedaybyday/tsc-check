import yargs from 'yargs';
import path from 'path';
import fs from 'fs';
import { check } from './lib/check';

async function init() {
    const { version } = await fs.promises
        .readFile(path.join(__dirname, '../', 'package.json'), 'utf8')
        .then(JSON.parse);
    yargs
        .scriptName('tsc-check')
        .version(version)
        .command(
            'tsc-check [files...]',
            'Check Typescript Files',
            (yargs) => {
                return yargs.option('files', {
                    alias: 'f',
                    describe: 'Output file',
                    type: 'array',
                });
            },
            (argv) => {
                console.log(argv.files);
                const { files } = argv;
                if (files) {
                    check({
                        files,
                    });
                }
            }
        )
        .demandCommand(1)
        .strict()
        .parse();
}

init();
