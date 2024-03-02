import yargs from 'yargs';
import path from 'path';
import fs from 'fs';

async function init() {
    const {version} = await fs.promises.readFile(path.join(__dirname, '../', 'package.json'), 'utf8').then(JSON.parse);
    yargs
        .scriptName('tsc-check')
        .version(version)
        .command('tsc-check [files...]', 'Check Typescript Files', (yargs) => {
            return yargs
              .option('i', {
                alias: 'ignore',
                describe: 'Pattern to ignore',
                type: 'string',
              })
              .option('f', {
                alias: 'file',
                describe: 'Output file',
                type: 'string',
              });
        })
        .demandCommand(1)
        .strict()
        .parse();
}

init();
