import { useCallback, useRef, useState, useEffect } from "react";
import styles from "./selfie.module.css";

function uploadSelfie() {
  const upload = (blob: Blob): void => {
    const formData = new FormData();
    formData.append("image", blob, "selfie.jpg");
    const success = navigator.sendBeacon("_frame", formData);
    if (!success) {
      throw new Error("Upload failed via sendBeacon");
    }
  };
  return { upload };
}

function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | undefined;

    const start = async (): Promise<void> => {
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

        setReady(true);
      } catch {
        setError("Unable to access camera");
      }
    };

    void start();

    return () => {
      stream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  return { videoRef, ready, error };
}


export default function Selfie() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { videoRef, ready, error: cameraError } = useCamera();
  const { upload } = uploadSelfie();

  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const capture = useCallback((): void => {
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

      upload(blob)

    }, "image/jpeg", 0.95);

  }, [videoRef, upload]);

  useEffect(() => {
    if (!ready) return;

    const timer = setTimeout(() => {
      capture();
    }, 600);

    return () => clearTimeout(timer);
  }, [ready, capture]);

  return (
    <div className={styles.wrapper}>
      <h3>Selfie verification</h3>

      {(cameraError || error) && (
        <p className={styles.error}>{cameraError || error}</p>
      )}

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
        onClick={capture}
        disabled={!ready || sending}
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
