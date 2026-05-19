import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ライブラリビルド設定。
// react / react-dom / mirador / @mui / @emotion / react-i18next は
// Mirador 4 本体が提供するため external 扱いにする。
export default defineConfig({
  plugins: [
    react({
      include: ['**/*.jsx', '**/*.js'],
    }),
  ],
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  build: {
    lib: {
      entry: 'src/index.jsx',
      name: 'MiradorLayerSlideshow',
      fileName: (format) => `mirador-layer-slideshow.${format}.js`,
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) => (
        /^(react|react-dom|mirador|react-i18next)(\/|$)/.test(id)
        || id.startsWith('@mui/')
        || id.startsWith('@emotion/')
      ),
      output: {
        exports: 'named',
      },
    },
  },
});
