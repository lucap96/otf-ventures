import { useLocation } from 'react-router-dom';

export default function Operators() {
  const location = useLocation();
  const src = `/operators.html${location.hash || ''}`;

  return (
    <div className="h-full min-h-screen bg-background">
      <iframe title="Operators" src={src} className="h-screen w-full border-0" />
    </div>
  );
}
