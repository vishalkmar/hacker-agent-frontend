import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/index.jsx';
import { Camera, X } from 'lucide-react';

// Live camera capture modal. Calls onCapture(File) with a JPEG snapshot.
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) {
        setErr('Camera unavailable: ' + e.message);
      }
    })();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const snap = () => {
    const v = videoRef.current;
    if (!v) return;
    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 1280;
    canvas.height = v.videoHeight || 720;
    canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        onCapture(file);
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-bg-secondary border border-line rounded-2xl p-4 shadow-lift w-[min(92vw,640px)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-txt-primary flex items-center gap-2"><Camera size={17} className="text-primary" /> Camera</h3>
          <button onClick={onClose} className="text-txt-muted hover:text-accent-red"><X size={18} /></button>
        </div>
        {err ? (
          <div className="text-sm text-accent-red py-10 text-center">{err}</div>
        ) : (
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl bg-black aspect-video object-cover" />
        )}
        <div className="flex justify-center gap-3 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={snap} disabled={!!err}><Camera size={15} /> Capture</Button>
        </div>
      </div>
    </div>
  );
}
