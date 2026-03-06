import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { builtinModules } from 'module';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/filterRdfs.ts', 'src/bin/filterRdfs.ts'],
    }),
  ],
  publicDir: false,
  build: {
    target: 'node20',
    ssr: true,
    lib: {
      entry: {
        'filterRdfs': 'src/filterRdfs.ts',
        'bin/filterRdfs': 'src/bin/filterRdfs.ts',
      },
      formats: ['es'],
    },
    outDir: 'dist-cli',
    emptyOutDir: true,
    rollupOptions: {
      external: [
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        'rdflib',
        /^rdflib\//,
      ],
      output: {
        banner: (chunk) =>
          chunk.name === 'bin/filterRdfs'
            ? '#!/usr/bin/env node'
            : '',
      },
    },
  },
});
