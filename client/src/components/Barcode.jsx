// Decorative barcode generated from the booking code (not a real scannable code)
export default function Barcode({ value, height = 56 }) {
  const bars = [];
  let x = 0;
  `#${value}#`.split('').forEach((ch) => {
    const n = ch.charCodeAt(0);
    for (let b = 0; b < 7; b++) {
      const w = (n >> b) & 1 ? 3 : 1.5;
      if (b % 2 === 0) bars.push(<rect key={x} x={x} y="0" width={w} height={height} fill="currentColor" />);
      x += w + 1.5;
    }
  });
  return (
    <svg viewBox={`0 0 ${x} ${height}`} width="100%" height={height} preserveAspectRatio="none" role="img" aria-label={`Barcode for ${value}`}>
      {bars}
    </svg>
  );
}
