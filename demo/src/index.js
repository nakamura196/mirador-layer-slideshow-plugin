import Mirador from 'mirador/dist/es/src/index';
import { miradorLayerSlideshowPlugin } from '../../src';

const config = {
  id: 'demo',
  windows: [{
    layerSlideshowEnabled: true,
    manifestId: 'https://gist.githubusercontent.com/nakamura196/0c6a28d03b34d18165bb0d4940673b7e/raw/9cf148fbf8df6cee43debaafd9a47d8757e9380a/kaishi.json',
  }],
};

console.log('miradorLayerSlideshowPlugin', miradorLayerSlideshowPlugin);

Mirador.viewer(config, [
  ...miradorLayerSlideshowPlugin,
]);
