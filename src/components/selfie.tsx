export default function Selfie({ onVerified }: { onVerified: () => void; }) {
  return (
    <div
      style={{
        border: "2px dashed #aaa",
        padding: 24,
        borderRadius: 12,
        marginTop: 16
      }}
    >
      <h3>Selfie verification</h3>
      <p>Camera + MediaPipe would run here.</p>

      <button
        onClick={onVerified}
        style={{ marginTop: 16 }}
      >
        Simulate successful face detection
      </button>
    </div>
  );
}
