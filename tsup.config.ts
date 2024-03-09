import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['index.ts', 'cli.ts', 'lib/tscRunner.ts'],
    splitting: true,
    minify: false,
    dts: './index.ts'
});
