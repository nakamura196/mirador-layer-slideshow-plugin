import { MiradorMenuButton } from 'mirador';
import StartIcon from '@mui/icons-material/PlayCircleOutline';
import StopIcon from '@mui/icons-material/Stop';

/**
 * スライドショーの開始 / 停止ボタン。
 *
 * @param {object}  props
 * @param {string}  props.label    - aria-label / ツールチップ文言
 * @param {string}  props.variant  - 'start' で再生アイコン、それ以外で停止アイコン
 */
export function ImageSlideshow({ label, variant, ...otherProps }) {
  return (
    <MiradorMenuButton aria-label={label} {...otherProps}>
      {variant === 'start' ? <StartIcon /> : <StopIcon />}
    </MiradorMenuButton>
  );
}
