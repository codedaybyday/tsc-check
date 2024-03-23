import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['index.ts', 'cli.ts', './lib/ts-compile-script.ts'],
    splitting: true,
    minify: process.env.NODE_ENV === 'production',
    dts: './index.ts',
    treeshake: true
});
