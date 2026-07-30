import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Eye, EyeOff } from 'lucide-react';
import { HandPosition } from '../types';

interface HandTrackingCameraProps {
  onHandPositionsUpdate: (positions: HandPosition[]) => void;
  onSpawnFlower: (x: number, y: number) => void;
}

export const HandTrackingCamera: React.FC<HandTrackingCameraProps> = ({
  onHandPositionsUpdate,
  onSpawnFlower,
}) => {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [handsDetectedCount, setHandsDetectedCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handsRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef = useRef<any>(null);

  // Position history for smooth lerping & distance threshold for flower spawning
  const lastHandPosRef = useRef<Array<{ x: number; y: number; time: number }>>([]);

  // Start Camera and Initialize MediaPipe Hands
  const startCameraTracking = useCallback(async () => {
    setErrorMessage(null);
    setIsInitializing(true);

    try {
      if (!window.Hands) {
        throw new Error('MediaPipe Hands 라이브러리를 로드하지 못했습니다.');
      }

      const hands = new window.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      handsRef.current = hands;

      hands.onResults((results: { multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>> }) => {
        const video = videoRef.current;
        const previewCanvas = previewCanvasRef.current;

        // Draw preview video frame & hand skeleton
        if (previewCanvas && video && video.readyState >= 2) {
          const pCtx = previewCanvas.getContext('2d');
          if (pCtx) {
            previewCanvas.width = video.videoWidth || 320;
            previewCanvas.height = video.videoHeight || 240;

            pCtx.save();
            pCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
            // Mirror image for preview
            pCtx.translate(previewCanvas.width, 0);
            pCtx.scale(-1, 1);
            pCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);

            // Draw hand landmark points on preview
            if (results.multiHandLandmarks) {
              results.multiHandLandmarks.forEach((landmarks) => {
                pCtx.fillStyle = '#FFB040';
                pCtx.strokeStyle = '#FFFFFF';
                pCtx.lineWidth = 2;

                landmarks.forEach((pt) => {
                  const px = pt.x * previewCanvas.width;
                  const py = pt.y * previewCanvas.height;
                  pCtx.beginPath();
                  pCtx.arc(px, py, 3, 0, Math.PI * 2);
                  pCtx.fill();
                  pCtx.stroke();
                });

                // Highlight index finger tip (landmark 8)
                const indexTip = landmarks[8];
                if (indexTip) {
                  pCtx.fillStyle = '#00FFCC';
                  pCtx.beginPath();
                  pCtx.arc(indexTip.x * previewCanvas.width, indexTip.y * previewCanvas.height, 6, 0, Math.PI * 2);
                  pCtx.fill();
                }
              });
            }
            pCtx.restore();
          }
        }

        // Process tracked hand positions for full screen media art canvas
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          setHandsDetectedCount(results.multiHandLandmarks.length);

          const screenW = window.innerWidth;
          const screenH = window.innerHeight;
          const currentHandPositions: HandPosition[] = [];

          results.multiHandLandmarks.forEach((landmarks, idx) => {
            // Index finger tip (index 8) is primary pointer, or palm center (index 9)
            const indexTip = landmarks[8];
            if (!indexTip) return;

            // Mirror horizontally (1 - x) so moving hand right moves pointer right
            const targetX = (1 - indexTip.x) * screenW;
            const targetY = indexTip.y * screenH;

            // Lerp smoothing with previous position if exists
            let smoothX = targetX;
            let smoothY = targetY;

            if (lastHandPosRef.current[idx]) {
              const prev = lastHandPosRef.current[idx];
              smoothX = prev.x + (targetX - prev.x) * 0.45;
              smoothY = prev.y + (targetY - prev.y) * 0.45;
            }

            currentHandPositions.push({
              id: `hand_${idx}`,
              x: smoothX,
              y: smoothY,
              rawX: indexTip.x,
              rawY: indexTip.y,
            });

            // Trigger flower stamp with distinct spatial gaps rather than continuous hand trailing
            const lastPos = lastHandPosRef.current[idx];
            const now = performance.now();

            if (!lastPos) {
              onSpawnFlower(smoothX, smoothY);
              lastHandPosRef.current[idx] = { x: smoothX, y: smoothY, time: now };
            } else {
              const dist = Math.hypot(smoothX - lastPos.x, smoothY - lastPos.y);
              const timeDiff = now - lastPos.time;

              // Spawn flower only when hand moves to a new distinct spot (> 110px away)
              // OR when hand pauses/hovers over a spot (> 650ms)
              if (dist > 110 || timeDiff > 650) {
                onSpawnFlower(smoothX, smoothY);
                lastHandPosRef.current[idx] = { x: smoothX, y: smoothY, time: now };
              }
            }
          });

          onHandPositionsUpdate(currentHandPositions);
        } else {
          setHandsDetectedCount(0);
          lastHandPosRef.current = [];
          onHandPositionsUpdate([]);
        }
      });

      if (videoRef.current && window.Camera) {
        const camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480,
        });

        cameraRef.current = camera;
        await camera.start();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error('Camera Hand Tracking error:', err);
      setErrorMessage('카메라 접근 권한을 허용해주세요.');
      setIsCameraActive(false);
    } finally {
      setIsInitializing(false);
    }
  }, [onHandPositionsUpdate, onSpawnFlower]);

  // Stop Camera Tracking
  const stopCameraTracking = useCallback(() => {
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch {
        // cleanup silent
      }
      cameraRef.current = null;
    }

    if (handsRef.current) {
      try {
        handsRef.current.close();
      } catch {
        // cleanup silent
      }
      handsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
    setHandsDetectedCount(0);
    lastHandPosRef.current = [];
    onHandPositionsUpdate([]);
  }, [onHandPositionsUpdate]);

  // Toggle Camera State
  const toggleCamera = () => {
    if (isCameraActive) {
      stopCameraTracking();
    } else {
      startCameraTracking();
    }
  };

  useEffect(() => {
    return () => {
      stopCameraTracking();
    };
  }, [stopCameraTracking]);

  return (
    <>
      {/* Hidden Video Feed for MediaPipe Processing */}
      <video ref={videoRef} className="hidden" playsInline muted />

      {/* Camera Control Button on Top Bar */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-2">
        <button
          onClick={toggleCamera}
          disabled={isInitializing}
          aria-label="카메라 모드 토글"
          className={`p-2.5 rounded-full backdrop-blur-md border transition-all cursor-pointer shadow-md ${
            isCameraActive
              ? 'bg-amber-500/80 hover:bg-amber-500 border-amber-300/60 text-white animate-pulse'
              : 'bg-black/40 hover:bg-black/60 border-white/20 text-white/90'
          }`}
        >
          {isCameraActive ? <Camera className="w-5 h-5 text-amber-200" /> : <CameraOff className="w-5 h-5 text-white/70" />}
        </button>

        {/* Toggle Preview Window */}
        {isCameraActive && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white/90 transition-all cursor-pointer shadow-md"
            aria-label="카메라 미리보기 토글"
          >
            {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Camera Status & Small PiP Preview Overlay */}
      {isCameraActive && showPreview && (
        <div className="fixed top-18 left-4 z-50 w-40 sm:w-48 p-1.5 rounded-2xl bg-black/50 backdrop-blur-lg border border-white/20 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/80">
            <canvas ref={previewCanvasRef} className="w-full h-full object-cover" />
            <div className="absolute top-1.5 left-2 px-1.5 py-0.5 rounded-full bg-black/60 flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${handsDetectedCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
            </div>
          </div>
        </div>
      )}

      {/* Camera Error Modal Banner */}
      {errorMessage && (
        <div className="fixed top-20 left-4 z-50 px-4 py-2 rounded-xl bg-red-900/80 border border-red-400/50 text-white text-xs backdrop-blur-md shadow-lg animate-bounce">
          {errorMessage}
        </div>
      )}
    </>
  );
};
