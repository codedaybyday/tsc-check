import { performMultiTSCheck } from '../lib/performMultiTSCheck';
import path from 'path';
import fs from 'fs';
import child_process from 'child_process';

jest.mock('child_process');
jest.spyOn(require, 'resolve').mockImplementation((mod) => {
    if (mod === './lib/tsCompileRunner') {
        return '/mocked/path/to/tsCompileRunner.js';
    }
    return path.join(__dirname, '../dist/lib/tsCompileRunner.js');
});

describe('performMultiTSCheck', () => {
    let readFileSyncSpy: jest.SpyInstance;
    let execSyncSpy: jest.SpyInstance;

    beforeEach(() => {
        readFileSyncSpy = jest.spyOn(fs, 'readFileSync');
        execSyncSpy = jest.spyOn(child_process, 'execSync');
    });

    afterEach(() => {
        readFileSyncSpy.mockRestore();
    });

    test('should return error when filenames is empty', async () => {
        // arrange
        const options = { filenames: [] };

        // act
        const result = await performMultiTSCheck(options);

        // assert
        expect(result?.error).toBeDefined();
    });

    test('should return error when no tsconfig.json found for files', async () => {
        // arrange
        const options = { filenames: ['file1.ts', 'file2.ts'] };
        readFileSyncSpy.mockReturnValue(JSON.stringify({}));

        // act
        const result = await performMultiTSCheck(options);

        // assert
        expect(result?.error).toBeDefined();
    });

    test('should categorize files and generate commands correctly', async () => {
        // arrange
        const options = { filenames: ['file1.ts', 'file2.ts'] };
        readFileSyncSpy.mockReturnValue(JSON.stringify({ files: ['file1.ts', 'file2.ts'] }));
        execSyncSpy.mockReturnValue('');

        // act
        const result = await performMultiTSCheck(options);

        // assert
        expect(result?.error).toBeNull();
        expect(result?.commands).toBeDefined();
    });

    test('should categorize files with references and generate commands correctly', async () => {
        // arrange
        const options = { filenames: ['file1.ts', 'file2.ts'] };
        readFileSyncSpy.mockReturnValue(
            JSON.stringify({ files: ['file1.ts', 'file2.ts'], references: [{ path: 'tsconfig.ref.json' }] })
        );
        execSyncSpy.mockReturnValue('');

        // act
        const result = await performMultiTSCheck(options);

        // assert
        expect(result?.error).toBeNull();
        expect(result?.commands).toBeDefined();
    });

    test('should categorize files not in references to original tsconfig and generate commands correctly', async () => {
        // arrange
        const options = { filenames: ['file1.ts', 'file2.ts'] };
        readFileSyncSpy
            .mockReturnValueOnce(JSON.stringify({ files: ['file1.ts'], references: [{ path: 'tsconfig.ref.json' }] }))
            .mockReturnValueOnce(JSON.stringify({ files: ['file2.ts'] }));
        execSyncSpy?.mockReturnValue('');

        // act
        const result = await performMultiTSCheck(options);

        // assert
        expect(result?.error).toBeNull();
        expect(result?.commands).toBeDefined();
    });
});
