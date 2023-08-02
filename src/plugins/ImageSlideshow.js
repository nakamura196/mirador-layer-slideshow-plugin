import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { MiradorMenuButton } from 'mirador/dist/es/src/components/MiradorMenuButton';

import StartIcon from '@material-ui/icons/PlayCircleOutline';
import StopIcon from '@material-ui/icons/Stop';

export default class ImageSlideshow extends Component {
  render() {
    const { label, variant, ...otherProps } = this.props;
    return (
      <MiradorMenuButton
        aria-label={label}
        {...otherProps}
      >
        { variant === 'start' ? <StartIcon /> : <StopIcon /> }
      </MiradorMenuButton>
    );
  }
}

ImageSlideshow.propTypes = {
  containerId: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  variant: PropTypes.string.isRequired,
};
