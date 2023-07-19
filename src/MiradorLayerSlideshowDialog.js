import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Dialog, DialogActions, DialogTitle, Typography,
  ListItemIcon, ListItemText, MenuItem, Box, LinearProgress,
} from '@material-ui/core';

import { getContainerId } from 'mirador/dist/es/src/state/selectors/config';
import ScrollIndicatedDialogContent from 'mirador/dist/es/src/containers/ScrollIndicatedDialogContent';

import StartIcon from '@material-ui/icons/PlayCircleOutline';
import StopIcon from '@material-ui/icons/Stop';

import mirador from 'mirador/dist/es/src/index';

// Function to retrieve layers from manifests based on target canvas id
const getLayers = (manifests, targetCanvasId) => {
  const layersMap = {};

  Object.keys(manifests).forEach((manifestId) => {
    const { json } = manifests[manifestId];
    // console.log({ json });
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

// Reducer function to handle actions related to layers
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
  closeDialog: () => dispatch({ type: 'CLOSE_WINDOW_DIALOG', windowId }),
  startSlideshow: interval => dispatch({ type: 'START_SLIDESHOW', windowId, interval }),
  stopSlideshow: () => dispatch({ type: 'STOP_SLIDESHOW', windowId }),
  updateViewport: (boxToZoom, zoom) => dispatch(updateViewportAction(windowId, boxToZoom, zoom)),
  updateLayers: (canvasId, payload) => dispatch(updateLayersAction(windowId, canvasId, payload)),
  updateIndex: index => dispatch({ type: 'UPDATE_INDEX', windowId, index }),
});

// Map state to props
const mapStateToProps = (state, { windowId }) => {
  const { manifests, viewers, windows } = state;
  const canvasId = (windows[windowId] && windows[windowId].canvasId) || null;
  const zoom = (viewers[windowId] && viewers[windowId].zoom) || 0;
  const layersObj = getLayers(manifests, canvasId);

  return {
    canvasWidth: layersObj.canvasWidth,
    canvasHeight: layersObj.canvasHeight,
    canvasId,
    zoom,
    layers: JSON.stringify(layersObj.layers),
    viewers: JSON.stringify(viewers),
    containerId: getContainerId(state),
    open: (state.layersOption[windowId] && state.layersOption[windowId].openDialog === 'layers'),
    interval: state.layersDialog[windowId] && state.layersDialog[windowId].interval,
    on: state.layersDialog[windowId] && state.layersDialog[windowId].on,
    index: state.layersDialog[windowId] && state.layersDialog[windowId].index,
  };
};

const calcBoxToZoom = (targetMemberId, canvasWidth, canvasHeight) => {
  let x1 = 0;
  let y1 = 0;
  let w1 = canvasWidth;
  let h1 = canvasHeight;

  if (targetMemberId && targetMemberId.includes('#xywh=')) {
    const [x0, y0, w0, h0] = targetMemberId.split('#xywh=')[1].split(',');

    x1 = Number(x0);
    y1 = Number(y0);
    w1 = Number(w0);
    h1 = Number(h0);
  }

  return {
    x: x1,
    y: y1,
    width: w1,
    height: h1,
  };
};

function LinearProgressWithLabel(props) {
  const { index, total } = props;
  const progress = index / (total - 1) * 100;
  return (

    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Box sx={{ width: '100%', mr: 1 }}>
        <LinearProgress variant="determinate" value={progress} />
      </Box>
      <Box sx={{ minWidth: 70 }}>
        <Typography variant="body2" color="text.secondary">
          {`${index} / ${total - 1}`}
        </Typography>
      </Box>
    </Box>
  );
}

LinearProgressWithLabel.propTypes = {
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
};

// MiradorLayerSlideshowDialog component
export class MiradorLayerSlideshowDialog extends Component {
  // Stop the slideshow
  stop() {
    const { stopSlideshow, interval } = this.props;
    clearInterval(interval);
    stopSlideshow();
  }

  // Start the slideshow
  start() {
    const {
      startSlideshow,
      zoom,
      layers,
      canvasId,
      updateViewport,
      updateLayers,
      updateIndex,
      canvasWidth,
      canvasHeight,
    } = this.props;

    // Parse layers JSON string into JavaScript object
    const parsedLayers = JSON.parse(layers);

    // Initialize count variable to 0
    let count = 0;

    // Define transition duration in milliseconds
    const duration = 2000;

    // Store the number of layers
    const layersSize = parsedLayers.length;

    // Initialize interval to repeatedly execute the code block
    const interval = setInterval(() => {
      // Initialize an object to store layer visibility states
      const payload = {};

      // Calculate the modulus to determine the current layer
      const mod = count % layersSize;

      // Initialize a variable to store the target member ID
      let targetMemberId = null;

      // Calculate the reversed index for visibility toggling
      const reversedIndex = layersSize - mod - 1;

      // Iterate over each layer
      for (let i = 0; i < layersSize; i += 1) {
        // Fetch the current layer's options
        const layerOption = parsedLayers[i];

        // Fetch the layer's ID and 'on' property
        const layerId = layerOption['@id'];
        const { on } = layerOption;

        // Check if current index is greater or equal to the reversed index
        const visibility = i >= reversedIndex;

        // Update the payload object with the current layer's visibility
        payload[layerId] = {
          visibility,
        };

        // If the current index matches the reversed index, store the 'on' property value as target
        if (i === reversedIndex) {
          targetMemberId = on;
        }
      }

      // Calculate the box to zoom based on target member ID and canvas dimensions
      const boxToZoom = calcBoxToZoom(targetMemberId, canvasWidth, canvasHeight);

      // Update the viewport with calculated zoom box and existing zoom value
      updateViewport(boxToZoom, zoom);

      // After a third of the transition duration, update the layers
      setTimeout(() => {
        updateLayers(canvasId, payload);
      }, duration / 3);

      // Update the index value
      updateIndex(mod);

      // Increment the count by 1
      count += 1;
    }, duration);

    // Start the slideshow with the defined interval
    startSlideshow(interval);
  }


  // Render the component
  render() {
    const {
      closeDialog,
      containerId,
      open,
      on,
      layers,
      index,
    } = this.props;

    const totalLayersSize = JSON.parse(layers).length;


    if (!open) return ('');

    const startOrStopButton = !on ? (
      <MenuItem onClick={() => this.start()}>
        <ListItemIcon>
          <StartIcon />
        </ListItemIcon>
        <ListItemText primaryTypographyProps={{ variant: 'body1' }}>
          Start
        </ListItemText>
      </MenuItem>
    ) : (
      <MenuItem onClick={() => this.stop()}>
        <ListItemIcon>
          <StopIcon />
        </ListItemIcon>
        <ListItemText primaryTypographyProps={{ variant: 'body1' }}>
          Stop
        </ListItemText>
      </MenuItem>
    );

    return (
      <React.Fragment>
        <Dialog
          container={document.querySelector(`#${containerId} .mirador-viewer`)}
          disableEnforceFocus
          onClose={closeDialog}
          open={open}
          scroll="paper"
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle disableTypography>
            <Typography variant="h2">Layer Slideshow</Typography>
          </DialogTitle>
          <ScrollIndicatedDialogContent>

            {startOrStopButton}

            <Box sx={{ marginTop: '16px', marginBottom: '16px', width: '100%' }}>

              <LinearProgressWithLabel index={index} total={totalLayersSize} />
            </Box>

          </ScrollIndicatedDialogContent>
          <DialogActions>
            <Button onClick={closeDialog} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </React.Fragment>
    );
  }
}

// Define PropTypes for MiradorLayerSlideshowDialog
MiradorLayerSlideshowDialog.propTypes = {
  // state
  canvasId: PropTypes.string.isRequired,
  open: PropTypes.bool,
  layers: PropTypes.string,
  containerId: PropTypes.string.isRequired,
  on: PropTypes.bool,
  index: PropTypes.number,
  interval: PropTypes.number,
  zoom: PropTypes.number,
  canvasWidth: PropTypes.number,
  canvasHeight: PropTypes.number,
  // dispatch
  closeDialog: PropTypes.func.isRequired,
  startSlideshow: PropTypes.func,
  stopSlideshow: PropTypes.func,
  updateViewport: PropTypes.func,
  updateLayers: PropTypes.func,
  updateIndex: PropTypes.func,
};

// Define default props for MiradorLayerSlideshowDialog
MiradorLayerSlideshowDialog.defaultProps = {
  // state
  layers: '[]',
  open: false,
  on: false,
  index: 0,
  interval: 0,
  zoom: 0,
  canvasWidth: 0,
  canvasHeight: 0,

  // dispatch
  startSlideshow: () => { },
  stopSlideshow: () => { },
  updateViewport: () => { },
  updateLayers: () => { },
  updateIndex: () => { },
};

// Export the component with additional metadata
export default {
  target: 'Window',
  mode: 'add',
  name: 'MiradorLayerSlideshowDialog',
  component: MiradorLayerSlideshowDialog,
  mapDispatchToProps,
  mapStateToProps,
  reducers: {
    layersDialog: layersDialogReducer,
  },
};
