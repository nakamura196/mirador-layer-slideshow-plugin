import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import StartIcon from '@material-ui/icons/PlayCircleOutline';
import LayersIcon from '@material-ui/icons/Layers';

const layersReducer = (state = {}, action) => {
  if (action.type === 'OPEN_WINDOW_DIALOG') {
    return {
      ...state,
      [action.windowId]: {
        openDialog: action.dialogType,
      },
    };
  }

  if (action.type === 'CLOSE_WINDOW_DIALOG') {
    return {
      ...state,
      [action.windowId]: {
        openDialog: null,
      },
    };
  }


  return state;
};

const mapDispatchToProps = (dispatch, { windowId }) => ({
  openLayersDialog: () => dispatch({ type: 'OPEN_WINDOW_DIALOG', windowId, dialogType: 'layers' }),
});

class MiradorLayerSlideshow extends Component {
  openDialogAndCloseMenu() {
    const { handleClose, openLayersDialog } = this.props;

    openLayersDialog();
    handleClose();
  }

  render() {
    return (
      <React.Fragment>
        <MenuItem onClick={() => this.openDialogAndCloseMenu()}>
          <ListItemIcon>
            <LayersIcon />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ variant: 'body1' }}>
            Layer Slideshow
          </ListItemText>
        </MenuItem>
      </React.Fragment>
    );
  }
}

MiradorLayerSlideshow.propTypes = {
  handleClose: PropTypes.func,
  openLayersDialog: PropTypes.func,

};

MiradorLayerSlideshow.defaultProps = {
  handleClose: () => { },
  openLayersDialog: () => { },

};

export default {
  target: 'WindowTopBarPluginMenu',
  mode: 'add',
  name: 'MiradorLayerSlideshowPlugin',
  component: MiradorLayerSlideshow,
  mapDispatchToProps,
  reducers: {
    layersOption: layersReducer,
  },
};
