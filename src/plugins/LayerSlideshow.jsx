import Box from '@mui/material/Box';

/**
 * LayerSlideshow
 *
 * スライドショーの進捗を「現在 / 全体」形式で表示するインジケータ。
 * Mirador 3 版ではスライダー（プログレスバー）を折りたたみ表示していたが、
 * 数値表示の方が分かりやすいため、ツールバー内のテキスト表示に置き換えた。
 *
 * @param {object} props
 * @param {number} props.value - 現在のレイヤー index（0 始まり）
 * @param {number} props.max   - レイヤー index の最大値（= レイヤー数 - 1）
 */
export function LayerSlideshow({ value = 0, max = 0 }) {
  const total = max + 1;
  if (total <= 0) return null;

  const current = Math.min(value + 1, total);

  return (
    <Box
      component="span"
      aria-label={`${current} / ${total}`}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.5,
        fontWeight: 'bold',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {`${current} / ${total}`}
    </Box>
  );
}
