import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    dts({
      include: ['src'],
      exclude: ['**/*.stories.tsx', '**/*.test.tsx', '**/*.test.ts'],
      // rollupTypes bundles all .d.ts into one file via api-extractor.
      // Enable this once there are actual component exports; api-extractor
      // crashes on a completely empty entry module.
      rollupTypes: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TrendyUniqueUI',
      formats: ['es', 'cjs'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.cjs'),
    },
    rollupOptions: {
      // These are provided by the consumer's app — do NOT bundle them
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        '@mui/material',
        '@emotion/react',
        '@emotion/styled',
      ],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          '@mui/material': 'MuiMaterial',
        },
      },
    },
    sourcemap: true,
    // Keep code readable in dist for debugging; minification is consumer's job
    minify: false,
  },
});
