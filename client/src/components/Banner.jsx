import { imgUrl } from '../api';

// Shows the uploaded banner, or a glossy blue panel with the event title when there is no image
export default function Banner({ event, height = 160, rounded = false }) {
  const src = imgUrl(event.banner);
  const radius = rounded ? { borderRadius: '0.9rem' } : {};
  if (src) return <img src={src} alt={event.title} className="banner-img" style={{ height, ...radius }} />;
  return (
    <div className="banner-ph" style={{ height, ...radius }} role="img" aria-label={event.title}>
      <span>{event.title}</span>
    </div>
  );
}
