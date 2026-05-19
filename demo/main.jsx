import Mirador from 'mirador';
import miradorLayerSlideshowPlugin from '../src/index.jsx';

const BASE = import.meta.env.BASE_URL || '/';

// ?manifest= パラメータで外部マニフェストを指定可能
const params = new URLSearchParams(window.location.search);
const manifestParam = params.get('manifest');

// レイヤー（複数の painting annotation）を持つローカルデモ用マニフェスト。
// 東京大学駒場図書館「泰平丸起絵図」(IIIF Presentation API 2.x) をベースに
// public/demo/manifest.json として同梱している。
const DEFAULT_MANIFEST = `${BASE}demo/manifest.json`;

const config = {
  id: 'demo',
  windows: [
    {
      layerSlideshowEnabled: true,
      manifestId: manifestParam || DEFAULT_MANIFEST,
    },
  ],
};

Mirador.viewer(config, miradorLayerSlideshowPlugin);
