import { useState, useRef, useCallback } from 'react';
import { MediaArtCanvas, MediaArtCanvasHandle } from './components/MediaArtCanvas';
import { HandTrackingCamera } from './components/HandTrackingCamera';
import { AudioBGM } from './components/AudioBGM';
import { HandPosition } from './types';

export default function App() {
  const [stampCount, setStampCount] = useState<number>(0);
  const [handPositions, setHandPositions] = useState<HandPosition[]>([]);
  const canvasRef = useRef<MediaArtCanvasHandle | null>(null);

  const handleStampCreated = () => {
    setStampCount((prev) => prev + 1);
  };

  const handleHandPositionsUpdate = useCallback((positions: HandPosition[]) => {
    setHandPositions(positions);
  }, []);

  const handleSpawnFlowerFromHand = useCallback((x: number, y: number) => {
    if (canvasRef.current) {
      canvasRef.current.spawnFlower(x, y);
    }
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {/* Fullscreen Interactive Media Art Canvas */}
      <MediaArtCanvas
        ref={canvasRef}
        handPositions={handPositions}
        onStampCreated={handleStampCreated}
      />

      {/* Camera Hand Tracking Interactive Wall Control */}
      <HandTrackingCamera
        onHandPositionsUpdate={handleHandPositionsUpdate}
        onSpawnFlower={handleSpawnFlowerFromHand}
      />

      {/* Ambient Sound Toggle */}
      <AudioBGM stampTrigger={stampCount} />
    </main>
  );
}

