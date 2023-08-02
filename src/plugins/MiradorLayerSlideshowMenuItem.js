import React from 'react';
import PropTypes from 'prop-types';
import MenuItem from '@material-ui/core/MenuItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import LayersIcon from '@material-ui/icons/Layers';

const MiradorLayerSlideshowMenuItem = ({
  enabled, handleClose, t, updateWindow, windowId,
}) => {
  const handleClickOpen = () => {
    handleClose();
    updateWindow(windowId, { layerSlideshowEnabled: !enabled });
  };

  return (
    <MenuItem onClick={handleClickOpen}>
      <ListItemIcon>
        <LayersIcon />
      </ListItemIcon>
      <ListItemText primaryTypographyProps={{ variant: 'body1' }}>
        { enabled ? t('hide') : t('show') }
      </ListItemText>
    </MenuItem>
  );
};

MiradorLayerSlideshowMenuItem.propTypes = {
  enabled: PropTypes.bool,
  handleClose: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
  updateWindow: PropTypes.func.isRequired,
  windowId: PropTypes.string.isRequired,
};

MiradorLayerSlideshowMenuItem.defaultProps = {
  enabled: true,
};

export default MiradorLayerSlideshowMenuItem;
