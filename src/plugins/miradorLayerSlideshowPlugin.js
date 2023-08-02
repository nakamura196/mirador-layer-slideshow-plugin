import withTheme from '@material-ui/core/styles/withTheme';
import * as actions from 'mirador/dist/es/src/state/actions';
import { getWindowConfig, getViewer, getContainerId } from 'mirador/dist/es/src/state/selectors';
import mirador from 'mirador/dist/es/src/index';
import MiradorLayerSlideshow from './MiradorLayerSlideshow';
import MiradorLayerSlideshowMenuItem from './MiradorLayerSlideshowMenuItem';
import translations from '../translations';

const getLayers = (manifests, targetCanvasId) => {
  const layersMap = {};

  Object.keys(manifests).forEach((manifestId) => {
    const { json } = manifests[manifestId];
    const { sequences } = json;

    sequences.forEach((sequence) => {
      const { canvases } = sequence;

      canvases.forEach((canvas) => {
        const { images } = canvas;

        const canvasId = canvas['@id'];
        if (canvasId !== targetCanvasId) return;

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

            layers.push({
              '@id': defaultItem['@id'],
            });

            item.forEach((eachItem) => {
              layers.push(
                {
                  '@id': eachItem['@id'],
                },
              );
            });
          } else {
            layers.push({
              '@id': resource['@id'],
              on,
            });
          }
        });
      });
    });
  });

  return layersMap[targetCanvasId];
};

const layersDialogReducer = (state = {}, action) => {
  if (action.type === 'START_SLIDESHOW') {
    const afterState = {
      ...state,
      [action.windowId]: {
        on: true,
        interval: action.interval,
      },
    };
    return afterState;
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

// Function to create action to update viewport
const updateViewportAction = (windowId, boxToZoom, zoom) => (dispatch) => {
  const zoomCenter = {
    x: boxToZoom.x + boxToZoom.width / 2,
    y: boxToZoom.y + boxToZoom.height / 2,
  };

  const action = mirador.actions.updateViewport(windowId, {
    x: zoomCenter.x,
    y: zoomCenter.y,
    zoom,
  });
  dispatch(action);
};

// Function to create action to update layers
const updateLayersAction = (windowId, canvasId, payload) => (dispatch) => {
  const action = mirador.actions.updateLayers(windowId, canvasId, payload);
  dispatch(action);
};

// Map dispatch to props
const mapDispatchToProps = (dispatch, { windowId }) => ({
  updateWindow: actions.updateWindow, // 動かない
  closeDialog: (open) => dispatch({ type: 'CLOSE_WINDOW_DIALOG', windowId, open }),
  startSlideshow: (interval) => dispatch({ type: 'START_SLIDESHOW', windowId, interval }),
  stopSlideshow: () => dispatch({ type: 'STOP_SLIDESHOW', windowId }),
  updateViewport: (boxToZoom, zoom) => dispatch(updateViewportAction(windowId, boxToZoom, zoom)),
  updateLayers: (canvasId, payload) => dispatch(updateLayersAction(windowId, canvasId, payload)),
  updateIndex: (index) => dispatch({ type: 'UPDATE_INDEX', windowId, index }),
});

const mapStateToProps = (state, { windowId }) => {
  const { manifests, viewers, windows } = state;
  const canvasId = (windows[windowId] && windows[windowId].canvasId) || null;
  const zoom = (viewers[windowId] && viewers[windowId].zoom) || 0;
  const layersObj = getLayers(manifests, canvasId);

  console.log({ layersObj });

  return {
    containerId: getContainerId(state),
    enabled: getWindowConfig(state, { windowId }).layerSlideshowEnabled || false,
    open: state.layersDialog[windowId] && state.layersDialog[windowId].open,
    // getWindowConfig(state, { windowId }).imageToolsOpen || false,
    viewConfig: getViewer(state, { windowId }) || {},

    canvasWidth: layersObj.canvasWidth,
    canvasHeight: layersObj.canvasHeight,
    canvasId,
    zoom,
    layers: JSON.stringify(layersObj.layers),
    viewers: JSON.stringify(viewers),
    // containerId: getContainerId(state),
    // open: (state.layersOption[windowId] && state.layersOption[windowId].openDialog === 'layers'),
    interval: state.layersDialog[windowId] && state.layersDialog[windowId].interval,
    on: state.layersDialog[windowId] && state.layersDialog[windowId].on,
    index: state.layersDialog[windowId] && state.layersDialog[windowId].index,
  };
};

export default [
  {
    target: 'OpenSeadragonViewer',
    /*
    _mapDispatchToProps: {
      updateWindow: actions.updateWindow,
    },
    mapDispatchToProps: (dispatch, { windowId }) => ({
      updateWindow: actions.updateWindow,
      ...mapDispatchToProps(dispatch, { windowId }),
    }),
    */
    mapDispatchToProps,
    mapStateToProps,
    mode: 'add',
    component: withTheme(MiradorLayerSlideshow),
    config: {
      translations,
    },
    reducers: {
      layersDialog: layersDialogReducer,
    },
  },
  {
    target: 'WindowTopBarPluginMenu',
    component: MiradorLayerSlideshowMenuItem,
    mode: 'add',
    mapDispatchToProps: {
      updateWindow: actions.updateWindow,
    },
    mapStateToProps: (state, { windowId }) => ({
      enabled: getWindowConfig(state, { windowId }).layerSlideshowEnabled || false,
    }),
  },
];
