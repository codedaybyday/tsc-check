/**
 * @author liubeijing
 * @fileoverview 基于tscRunner实现的单独的运行脚本
 */
import minimist from 'minimist';
import {tscRunner} from './tscRunner';

const args = process.argv.slice(2);
const parsedArgs = minimist(args);

tscRunner({
    files: parsedArgs.f.split(','),
    tsconfigFilePath: parsedArgs.p,
    configFilePath: parsedArgs.c,
    debug: parsedArgs.debug,
    monorepo: parsedArgs.monorepo
});
