import {
  updateWindow,
  updateViewport,
  updateLayers,
  getWindowConfig,
  getViewer,
} from 'mirador';
import { MiradorLayerSlideshow } from './MiradorLayerSlideshow.jsx';
import { MiradorLayerSlideshowMenuItem } from './MiradorLayerSlideshowMenuItem.jsx';
import translations from '../translations.js';

/**
 * 対象 canvas のレイヤー（IIIF image choice）一覧を state から組み立てる。
 * IIIF Presentation API 2.x の sequences / canvases / images 構造を読む。
 */
const getLayers = (manifests, targetCanvasId) => {
  const layersMap = {};

  Object.keys(manifests).forEach((manifestId) => {
    const { json } = manifests[manifestId];
    const { sequences } = json || {};
    if (!sequences) return;

    sequences.forEach((sequence) => {
      const { canvases } = sequence;
      if (!canvases) return;

      canvases.forEach((canvas) => {
        const { images } = canvas;

        const canvasId = canvas['@id'];
        if (canvasId !== targetCanvasId || !images) return;

        const layers = [];
        layersMap[canvasId] = {
          layers,
          canvasWidth: canvas.width,
          canvasHeight: canvas.height,
        };

        images.forEach((image) => {
          const { resource, on } = image;

          if (resource.item) {
            const { item } = resource;
            const defaultItem = resource.default;

            layers.push({ '@id': defaultItem['@id'] });

            item.forEach((eachItem) => {
              layers.push({ '@id': eachItem['@id'] });
            });
          } else {
            layers.push({ '@id': resource['@id'], on });
          }
        });
      });
    });
  });

  return layersMap[targetCanvasId];
};

/** スライドショー状態を保持するプラグイン専用 reducer */
const layersDialogReducer = (state = {}, action) => {
  if (action.type === 'START_SLIDESHOW') {
    return {
      ...state,
      [action.windowId]: {
        on: true,
        interval: action.interval,
      },
    };
  }

  if (action.type === 'STOP_SLIDESHOW') {
    return {
      ...state,
      [action.windowId]: {
        on: false,
      },
    };
  }

  if (action.type === 'UPDATE_INDEX') {
    return {
      ...state,
      [action.windowId]: {
        ...state[action.windowId],
        index: action.index,
      },
    };
  }

  if (action.type === 'CLOSE_WINDOW_DIALOG') {
    return {
      ...state,
      [action.windowId]: {
        open: !action.open,
      },
    };
  }

  return state;
};

/** ズーム矩形の中心へ viewport を移動する thunk */
const updateViewportAction = (windowId, boxToZoom, zoom) => (dispatch) => {
  const zoomCenter = {
    x: boxToZoom.x + boxToZoom.width / 2,
    y: boxToZoom.y + boxToZoom.height / 2,
  };

  dispatch(updateViewport(windowId, {
    x: zoomCenter.x,
    y: zoomCenter.y,
    zoom,
  }));
};

/** レイヤーの表示状態を更新する thunk */
const updateLayersAction = (windowId, canvasId, payload) => (dispatch) => {
  dispatch(updateLayers(windowId, canvasId, payload));
};

/** OpenSeadragonViewer プラグイン用 mapDispatchToProps */
const mapDispatchToProps = (dispatch, { windowId }) => ({
  closeDialog: (open) => dispatch({ type: 'CLOSE_WINDOW_DIALOG', windowId, open }),
  startSlideshow: (interval) => dispatch({ type: 'START_SLIDESHOW', windowId, interval }),
  stopSlideshow: () => dispatch({ type: 'STOP_SLIDESHOW', windowId }),
  updateViewport: (boxToZoom, zoom) => dispatch(updateViewportAction(windowId, boxToZoom, zoom)),
  updateLayers: (canvasId, payload) => dispatch(updateLayersAction(windowId, canvasId, payload)),
  updateIndex: (index) => dispatch({ type: 'UPDATE_INDEX', windowId, index }),
});

/** OpenSeadragonViewer プラグイン用 mapStateToProps */
const mapStateToProps = (state, { windowId }) => {
  const { manifests, viewers, windows } = state;
  const canvasId = (windows[windowId] && windows[windowId].canvasId) || null;
  const zoom = (viewers[windowId] && viewers[windowId].zoom) || 0;

  let layersObj = getLayers(manifests, canvasId);
  if (!layersObj) {
    layersObj = { layers: [], canvasWidth: 0, canvasHeight: 0 };
  }

  const dialog = state.layersDialog[windowId] || {};

  return {
    enabled: getWindowConfig(state, { windowId }).layerSlideshowEnabled || false,
    open: dialog.open,
    viewConfig: getViewer(state, { windowId }) || {},
    canvasWidth: layersObj.canvasWidth,
    canvasHeight: layersObj.canvasHeight,
    canvasId,
    zoom,
    layers: JSON.stringify(layersObj.layers),
    interval: dialog.interval,
    on: dialog.on,
    index: dialog.index,
  };
};

export default [
  {
    target: 'OpenSeadragonViewer',
    mode: 'add',
    component: MiradorLayerSlideshow,
    mapDispatchToProps,
    mapStateToProps,
    config: {
      translations,
    },
    reducers: {
      layersDialog: layersDialogReducer,
    },
  },
  {
    target: 'WindowTopBarPluginMenu',
    mode: 'add',
    component: MiradorLayerSlideshowMenuItem,
    mapDispatchToProps: {
      updateWindow,
    },
    mapStateToProps: (state, { windowId }) => ({
      enabled: getWindowConfig(state, { windowId }).layerSlideshowEnabled || false,
    }),
  },
];
