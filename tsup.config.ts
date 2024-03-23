import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['index.ts', 'cli.ts', './lib/ts-compile-script.ts'],
    splitting: true,
    minify: false,
    dts: './index.ts',
});
