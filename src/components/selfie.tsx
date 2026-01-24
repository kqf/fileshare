import { useEffect, useRef, useState } from "react";
import styles from "./selfie.module.css";

export default function Selfie({
  onVerified
}: {
  onVerified: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraReady(true);
        }
      } catch (err) {
        setError("Unable to access camera");
        console.error(err);
      }
    }

    void startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(blob => {
      if (!blob) return;

      /*
        STUB:
        sendSelfieToBackend(blob);
      */

      console.log("Selfie captured", blob);
      onVerified();
    }, "image/jpeg", 0.95);
  };

  return (
    <div className={styles.wrapper}>
      <h3>Selfie verification</h3>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.previewContainer}>
        <video
          ref={videoRef}
          playsInline
          muted
          className={styles.video}
        />

        {/* Oval overlay */}
        <div className={styles.overlay}>
          <div className={styles.oval} />
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.hiddenCanvas} />

      <button
        onClick={captureSelfie}
        disabled={!cameraReady}
        className={styles.captureButton}
      >
        Capture selfie
      </button>

      <p className={styles.hint}>
        Align your face inside the oval.
      </p>
    </div>
  );
}
