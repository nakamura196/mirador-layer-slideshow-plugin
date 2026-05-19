import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import TuneSharpIcon from '@mui/icons-material/TuneSharp';
import CloseSharpIcon from '@mui/icons-material/CloseSharp';
import { useTranslation } from 'react-i18next';
import { MiradorMenuButton } from 'mirador';
import { LayerSlideshow } from './LayerSlideshow.jsx';
import { ImageSlideshow } from './ImageSlideshow.jsx';

/**
 * targetMemberId (`...#xywh=x,y,w,h`) からズーム対象の矩形を計算する。
 * 範囲指定が無ければ canvas 全体を返す。
 */
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
    x: x1, y: y1, width: w1, height: h1,
  };
};

/**
 * MiradorLayerSlideshow
 *
 * OpenSeadragonViewer に add モードで重ねて表示するコントロールパネル。
 * 開始 / 停止ボタンと進捗スライダーを持つ。
 *
 * Mirador 3 版では class component + withStyles / withWidth / withTheme /
 * compose を使用していたが、Mirador 4 では関数コンポーネント + MUI v7 フックへ
 * 全面的に書き換えた。
 */
export function MiradorLayerSlideshow({
  enabled = false,
  open = true,
  viewer = undefined,
  windowId,
  index = 0,
  layers = '[]',
  interval = 0,
  zoom = 0,
  canvasId,
  canvasWidth = 0,
  canvasHeight = 0,
  startSlideshow = () => {},
  stopSlideshow = () => {},
  updateViewport = () => {},
  updateLayers = () => {},
  updateIndex = () => {},
  closeDialog = () => {},
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isSmallDisplay = useMediaQuery(theme.breakpoints.down('sm'));

  const parsedLayers = JSON.parse(layers);
  const layersSize = parsedLayers.length;

  if (!viewer || !enabled) return null;

  const backgroundColor = theme.palette.shades.main;
  const foregroundColor = theme.palette.getContrastText(backgroundColor);

  /** スライドショーを開始する */
  const start = () => {
    if (layersSize === 0) return;

    let count = 0;
    const duration = 2000;

    const intervalId = setInterval(() => {
      const payload = {};
      const mod = count % layersSize;
      let targetMemberId = null;

      for (let i = 0; i < layersSize; i += 1) {
        const layerOption = parsedLayers[i];
        const layerId = layerOption['@id'];
        const { on } = layerOption;

        // 下絵（配列先頭）から順にレイヤーを累積表示する。
        // step が進むごとに 0, 1, 2 … と表示レイヤーを増やしていくため、
        // 下絵が常に見えたままフラップが 1 枚ずつ重なっていく。
        payload[layerId] = { visibility: i <= mod };

        // 今回新たに追加されたレイヤーを viewport のズーム対象にする。
        if (i === mod) targetMemberId = on;
      }

      const boxToZoom = calcBoxToZoom(targetMemberId, canvasWidth, canvasHeight);
      updateViewport(boxToZoom, zoom);

      setTimeout(() => {
        updateLayers(canvasId, payload);
      }, duration / 3);

      updateIndex(mod);
      count += 1;
    }, duration);

    startSlideshow(intervalId);
  };

  /** スライドショーを停止する */
  const stop = () => {
    clearInterval(interval);
    stopSlideshow();
  };

  /** パネルの開閉をトグルする */
  const toggleState = () => {
    closeDialog(open);
  };

  // ----- スタイル -----
  const rootSx = {
    backgroundColor: alpha(backgroundColor, 0.8),
    borderRadius: '25px',
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 999,
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
  };

  const border = `1px solid ${alpha(foregroundColor, 0.2)}`;
  const borderImageRight = 'linear-gradient('
    + 'to bottom, '
    + `${alpha(foregroundColor, 0)} 20%, `
    + `${alpha(foregroundColor, 0.2)} 20% 80%, `
    + `${alpha(foregroundColor, 0)} 80% )`;
  const borderImageBottom = borderImageRight.replace('to bottom', 'to right');

  const borderContainerSx = {
    border: 0,
    borderRight: border,
    borderImageSlice: 1,
    borderImageSource: borderImageRight,
    display: 'flex',
    flexDirection: 'row',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      borderBottom: border,
      borderRight: 'none',
      borderImageSource: borderImageBottom,
    },
  };

  /** メニューの開閉ボタン */
  const toggleButton = (
    <Box sx={(isSmallDisplay && open) ? borderContainerSx : undefined}>
      <MiradorMenuButton
        aria-expanded={open}
        aria-haspopup
        aria-label={t('collapse', { context: open ? 'open' : 'close' })}
        onClick={toggleState}
      >
        {open ? <CloseSharpIcon /> : <TuneSharpIcon />}
      </MiradorMenuButton>
    </Box>
  );

  return (
    <Paper elevation={4} sx={rootSx}>
      {isSmallDisplay && toggleButton}

      {open && (
        <Box sx={borderContainerSx}>
          {interval === 0 && (
            <ImageSlideshow
              label={t('start')}
              onClick={start}
              variant="start"
            />
          )}

          {interval > 0 && (
            <ImageSlideshow
              label={t('stop')}
              onClick={stop}
              variant="stop"
            />
          )}

          <LayerSlideshow max={layersSize - 1} value={index} />
        </Box>
      )}

      {!isSmallDisplay && toggleButton}
    </Paper>
  );
}

export default MiradorLayerSlideshow;
