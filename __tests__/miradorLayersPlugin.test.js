import miradorLayerSlideshowPlugin from '../src/miradorLayerSlideshowPlugin';

describe('miradorLayerSlideshowPlugin', () => {
  it('has the correct target', () => {
    expect(miradorLayerSlideshowPlugin.target).toBe('WindowTopBarPluginMenu');
  });
});
