import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['index.ts', 'cli.ts'],
    splitting: true,
    minify: false,
});
