// Alpha wordmark with a faceted "digital hummingbird" mark, rendered in the
// current text color. Drop the official logo at /public/alpha-logo.svg and
// swap the <svg> for an <img> if you'd rather use the exact brand asset.
export default function AlphaLogo({ size = 30, className = '' }) {
  return (
    <span className={`alpha-logo ${className}`} aria-label="Alpha">
      <svg width={size * 1.35} height={size} viewBox="0 0 54 40" fill="currentColor" aria-hidden>
        {/* scattered pixels — the dissolving wing */}
        <rect x="0" y="6" width="4" height="4" opacity="0.45" />
        <rect x="7" y="1" width="4" height="4" opacity="0.7" />
        <rect x="6" y="10" width="4" height="4" opacity="0.85" />
        <rect x="13" y="6" width="4" height="4" />
        {/* body + wing + beak, faceted */}
        <polygon points="18,10 34,16 22,20" />
        <polygon points="22,20 34,16 30,27" />
        <polygon points="34,16 52,9 36,19" />
        <polygon points="22,20 30,27 20,31" />
      </svg>
      <span className="alpha-word">ALPHA</span>
    </span>
  );
}
