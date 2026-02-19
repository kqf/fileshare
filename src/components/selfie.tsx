import { useEffect, useRef, useState, useCallback } from "react";
import styles from "./selfie.module.css";

type SelfieProps = {
  onVerified: () => void;
};

export default function Selfie({ onVerified }: SelfieProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const uploadSelfie = async (blob: Blob): Promise<void> => {
    const formData = new FormData();
    formData.append("image", blob, "selfie.jpg");

    const response = await fetch("/_frame", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }
  };

  const captureSelfie = useCallback((isAuto = false): void => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    setSending(true);

    canvas.toBlob(blob => {
      if (!blob) {
        setError("Failed to create image");
        setSending(false);
        return;
      }

      // 🔥 Explicitly handle promise
      void uploadSelfie(blob)
        .then(() => {
          if (!isAuto) {
            onVerified();
          }
        })
        .catch(err => {
          console.error(err);
          setError("Failed to send selfie");
        })
        .finally(() => {
          setSending(false);
        });

    }, "image/jpeg", 0.95);

  }, [onVerified]);

  useEffect(() => {
    let stream: MediaStream | undefined;

    const startCamera = async (): Promise<void> => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });

        const video = videoRef.current;
        if (!video) return;

        video.srcObject = stream;
        await video.play();

        setCameraReady(true);

        // auto capture
        setTimeout(() => {
          captureSelfie(true);
        }, 600);

      } catch (err) {
        console.error(err);
        setError("Unable to access camera");
      }
    };

    void startCamera();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [captureSelfie]);

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

        <div className={styles.overlay}>
          <div className={styles.oval} />
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.hiddenCanvas} />

      <button
        onClick={() => captureSelfie(false)}
        disabled={!cameraReady || sending}
        className={styles.captureButton}
      >
        {sending ? "Sending..." : "Capture selfie"}
      </button>

      <p className={styles.hint}>
        Align your face inside the oval.
      </p>
    </div>
  );
}
