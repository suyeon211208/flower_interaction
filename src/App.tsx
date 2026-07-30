import { useState } from 'react';
import { MediaArtCanvas } from './components/MediaArtCanvas';
import { AudioBGM } from './components/AudioBGM';

export default function App() {
  const [stampCount, setStampCount] = useState<number>(0);

  const handleStampCreated = () => {
    setStampCount((prev) => prev + 1);
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Fullscreen Interactive Media Art Canvas */}
      <MediaArtCanvas onStampCreated={handleStampCreated} />

      {/* Ambient Sound Toggle */}
      <AudioBGM stampTrigger={stampCount} />
    </main>
  );
}
