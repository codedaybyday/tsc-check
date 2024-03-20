import { init } from '../cli';
import fs from 'fs';
import { exec } from 'child_process';
import { performMultiTSCheck } from '../lib/performMultiTSCheck';

jest.mock('fs');
jest.mock('../lib/performMultiTSCheck');

describe('init', () => {
    test('should perform TypeScript check and output success message', (done) => {
        exec('node ../bin/tsc-check --files ../index.ts', (error, stdout, stderr) => {
            expect(stdout).toContain('tsc check success!');
            done();
        });
    });

    // 其他测试用例...
});
