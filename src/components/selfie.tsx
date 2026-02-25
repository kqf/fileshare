import { useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import styles from "./selfie.module.css";

async function capture(webcam: Webcam) {
  const screenshot = webcam.getScreenshot();
  if (!screenshot) {
    console.error("Failed to capture image");
    return;
  }

  const blob = await fetch(screenshot).then((res) => res.blob());

  const formData = new FormData();
  formData.append("image", blob, "selfie.jpg");
  await axios
    .post("/_frame", formData)
    .then(() => {})
    .catch((err) => {
      console.error("Upload failed", err);
    });
}

export default function Selfie() {
  const webcamRef = useRef<Webcam>(null);
  const [ready, setReady] = useState(false);
  const [uploading, setUploading] = useState(false);

  return (
    <div className={styles.wrapper}>
      <h3>Selfie verification</h3>
      <div className={styles.previewContainer}>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={{ facingMode: "user", width: 640, height: 480 }}
          onLoadedData={() => {
            if (webcamRef.current)
              capture(webcamRef.current)
                .finally(() => {
                  console.log("captured")
                })
                .catch(() => {
                  console.error("no captured")
                });
              setReady(true)
          }}
          className={styles.video}
        />
        <div className={styles.overlay}>
          <div className={styles.oval} />
        </div>
      </div>

      <button
        onClick={() => {
          setUploading(true);
          if (webcamRef.current)
            capture(webcamRef.current)
              .finally(() => {
                setUploading(false);
              })
              .catch(() => {});
        }}
        disabled={!ready || uploading}
        className={styles.captureButton}
      >
        {uploading ? "Uploading..." : "Capture selfie"}
      </button>

      <p className={styles.hint}>Align your face inside the oval.</p>
    </div>
  );
}
