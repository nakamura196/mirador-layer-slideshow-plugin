import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import LayersIcon from '@mui/icons-material/Layers';
import { useTranslation } from 'react-i18next';

/**
 * ウィンドウのプラグインメニューに追加される項目。
 * クリックで windowConfig の layerSlideshowEnabled をトグルする。
 *
 * windowId / handleClose は WindowTopBarPluginMenu から、
 * enabled / updateWindow は connect (mapStateToProps / mapDispatchToProps) から渡される。
 */
export function MiradorLayerSlideshowMenuItem({
  enabled = false,
  handleClose,
  updateWindow,
  windowId,
}) {
  const { t } = useTranslation();

  const handleClickOpen = () => {
    handleClose();
    updateWindow(windowId, { layerSlideshowEnabled: !enabled });
  };

  return (
    <MenuItem onClick={handleClickOpen}>
      <ListItemIcon>
        <LayersIcon />
      </ListItemIcon>
      <ListItemText slotProps={{ primary: { variant: 'body1' } }}>
        {enabled ? t('hide') : t('show')}
      </ListItemText>
    </MenuItem>
  );
}
