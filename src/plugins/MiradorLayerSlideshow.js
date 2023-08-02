import React, { Component } from 'react';
import PropTypes from 'prop-types';
import compose from 'lodash/flowRight';
import TuneSharpIcon from '@material-ui/icons/TuneSharp';
import CloseSharpIcon from '@material-ui/icons/CloseSharp';
import { fade } from '@material-ui/core/styles/colorManipulator';
import withStyles from '@material-ui/core/styles/withStyles';
import withWidth from '@material-ui/core/withWidth';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';
import LinearScaleIcon from '@material-ui/icons/LinearScale';
import LayerSlideshow from './LayerSlideshow';
import ImageSlideshow from './ImageSlideshow';

/** Styles for withStyles HOC */
const styles = ({ breakpoints, palette }) => {
  const backgroundColor = palette.shades.main;
  const foregroundColor = palette.getContrastText(backgroundColor);
  const border = `1px solid ${fade(foregroundColor, 0.2)}`;
  const borderImageRight = 'linear-gradient('
    + 'to bottom, '
    + `${fade(foregroundColor, 0)} 20%, `
    + `${fade(foregroundColor, 0.2)} 20% 80%, `
    + `${fade(foregroundColor, 0)} 80% )`;
  const borderImageBottom = borderImageRight.replace('to bottom', 'to right');
  return {
    root: {
      backgroundColor: fade(backgroundColor, 0.8),
      borderRadius: 25,
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 999,
      display: 'flex',
      flexDirection: 'row',
      [breakpoints.down('sm')]: {
        flexDirection: 'column',
      },
    },
    borderContainer: {
      border: 0,
      borderRight: border,
      borderImageSlice: 1,
      borderImageSource: borderImageRight,
      display: 'flex',
      flexDirection: 'row',
      [breakpoints.down('sm')]: {
        flexDirection: 'column',
        borderBottom: border,
        borderRight: 'none',
        borderImageSource: borderImageBottom,
      },
    },
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

class MiradorLayerSlideshow extends Component {
  constructor(props) {
    super(props);
    this.toggleState = this.toggleState.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(param) {
    const { updateViewport, windowId } = this.props;
    return (value) => updateViewport(windowId, { [param]: value });
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

        // If the current index matches the reversed index,
        // store the 'on' property value as target
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

  stop() {
    const { stopSlideshow, interval } = this.props;
    clearInterval(interval);
    stopSlideshow();
  }

  toggleState() {
    const {
      open, closeDialog, /* updateWindow, windowId, */
    } = this.props;

    // updateWindow(windowId, { imageToolsOpen: !open });
    closeDialog(open);
  }

  render() {
    const {
      classes, containerId, enabled, open, viewer, windowId, width,
      theme: { palette },
      t,
      index,
      layers,
      interval,
    } = this.props;

    // Parse layers JSON string into JavaScript object
    const parsedLayers = JSON.parse(layers);
    // Store the number of layers
    const layersSize = parsedLayers.length;

    if (!viewer || !enabled) return null;

    const backgroundColor = palette.shades.main;
    const foregroundColor = palette.getContrastText(backgroundColor);
    const isSmallDisplay = ['xs', 'sm'].indexOf(width) >= 0;

    /** Button for toggling the menu */
    const toggleButton = (
      <div className={(isSmallDisplay && open) ? classes.borderContainer : ''}>
        <MiradorMenuButton
          aria-expanded={open}
          aria-haspopup
          aria-label={t('collapse', { context: open ? 'open' : 'close' })}
          containerId={containerId}
          onClick={this.toggleState}
        >
          {open ? <CloseSharpIcon /> : <TuneSharpIcon />}
        </MiradorMenuButton>
      </div>
    );
    return (
      <div className={`MuiPaper-elevation4 ${classes.root}`}>
        {isSmallDisplay && toggleButton}
        {open
          && (
            <React.Fragment>
              <div className={classes.borderContainer}>
                {interval === 0 && (
                  <ImageSlideshow
                    containerId={containerId}
                    label={t('start')}
                    onClick={() => this.start()}
                    variant="start"
                  />
                )}

                {interval > 0 && (

                  <ImageSlideshow
                    containerId={containerId}
                    label={t('stop')}
                    onClick={() => this.stop()}
                    variant="stop"
                  />
                )}

                <LayerSlideshow
                  type="slider"
                  label={t('progress')}
                  max={layersSize - 1}
                  windowId={windowId}
                  value={index}
                  foregroundColor={foregroundColor}
                  containerId={containerId}
                >
                  <LinearScaleIcon />
                </LayerSlideshow>
              </div>
            </React.Fragment>
          )}
        {!isSmallDisplay && toggleButton}
      </div>
    );
  }
}

MiradorLayerSlideshow.propTypes = {
  classes: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  containerId: PropTypes.string.isRequired,
  enabled: PropTypes.bool,
  open: PropTypes.bool,
  t: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
  // updateViewport: PropTypes.func.isRequired,
  // updateWindow: PropTypes.func.isRequired,
  viewer: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  windowId: PropTypes.string.isRequired,
  width: PropTypes.oneOf(['lg', 'md', 'sm', 'xl', 'xs']).isRequired,

  // state
  canvasId: PropTypes.string.isRequired,
  // open: PropTypes.bool,
  layers: PropTypes.string,
  // containerId: PropTypes.string.isRequired,
  index: PropTypes.number,
  interval: PropTypes.number,
  zoom: PropTypes.number,
  canvasWidth: PropTypes.number,
  canvasHeight: PropTypes.number,
  // dispatch
  startSlideshow: PropTypes.func,
  stopSlideshow: PropTypes.func,
  updateViewport: PropTypes.func,
  updateLayers: PropTypes.func,
  updateIndex: PropTypes.func,

  closeDialog: PropTypes.func,
};

MiradorLayerSlideshow.defaultProps = {
  enabled: true,
  open: true,
  viewer: undefined,

  // state
  layers: '[]',
  // open: false,
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

  closeDialog: () => { },
};

// Export without wrapping HOC for testing.
export const TestableLayerSlideshow = MiradorLayerSlideshow;

export default compose(withStyles(styles), withWidth())(MiradorLayerSlideshow);
