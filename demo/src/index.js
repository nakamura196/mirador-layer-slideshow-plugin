import Mirador from 'mirador/dist/es/src/index';
import miradorLayerSlideshowPlugins from '../../src';

const config = {
  id: 'demo',
  miradorLayerSlideshowPlugin: {
    restrictLayerSlideshowOnSizeDefinition: true,
  },
  windows: [
    {
      // loadedManifest: 'http://127.0.0.1:5500/data/kaishi2.json',
      loadedManifest: 'https://gist.githubusercontent.com/nakamura196/0c6a28d03b34d18165bb0d4940673b7e/raw/9cf148fbf8df6cee43debaafd9a47d8757e9380a/kaishi.json',
    },
  ],
};

Mirador.viewer(config, [
  ...miradorLayerSlideshowPlugins,
]);
