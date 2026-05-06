import { defineConfig } from 'vite';
import { builtinModules } from 'module';

export default defineConfig({
  build: {
    target: 'node18',
    outDir: 'build',
    emptyOutDir: true,
    lib: {
      entry: 'index.js',
      formats: ['es'], // CHANGED: 'cjs' -> 'es' to support top-level await
      fileName: () => 'index.js'
    },
    rollupOptions: {
      // CHANGED: Externalize all runtime dependencies so they are not bundled.
      // They will be installed on the Pi via package.json.
      external: [
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
        'serialport',
        'express',
        'cors',
        'lowdb'
      ]
    }
  }
});