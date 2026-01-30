import { useEffect, useRef } from 'react';

interface VoiceVisualizerProps {
    stream: MediaStream | null;
    isRecording: boolean;
}

export function VoiceVisualizer({ stream, isRecording }: VoiceVisualizerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const analyserRef = useRef<AnalyserNode>();
    const sourceRef = useRef<MediaStreamAudioSourceNode>();

    useEffect(() => {
        if (!stream || !isRecording || !canvasRef.current) return;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        source.connect(analyser);
        analyser.fftSize = 256;

        analyserRef.current = analyser;
        sourceRef.current = source;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d')!;

        const draw = () => {
            if (!isRecording) return;

            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Dynamic "Breathing" Orb / Wave effect
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            let average = 0;

            for (let i = 0; i < bufferLength; i++) {
                average += dataArray[i];
            }
            average = average / bufferLength;

            // Base radius + dynamic volume expansion
            const radius = 30 + (average * 0.8);

            // Draw Glow
            const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius * 2);
            gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)'); // Red-500 core
            gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.2)');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 2, 0, 2 * Math.PI);
            ctx.fillStyle = gradient;
            ctx.fill();

            // Draw Inner Core (reacts sharper)
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fill();

            // Draw Frequency Bars (Circular)
            const bars = 30;
            const step = (Math.PI * 2) / bars;

            ctx.strokeStyle = 'rgba(254, 202, 202, 0.6)'; // Red-200
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';

            for (let i = 0; i < bars; i++) {
                // Map bar index to frequency data
                const dataIndex = Math.floor((i / bars) * (bufferLength / 2));
                const value = dataArray[dataIndex];
                const barHeight = 10 + (value * 0.5);

                const angle = i * step;
                const x1 = centerX + Math.cos(angle) * (radius * 0.6);
                const y1 = centerY + Math.sin(angle) * (radius * 0.6);
                const x2 = centerX + Math.cos(angle) * (radius * 0.6 + barHeight);
                const y2 = centerY + Math.sin(angle) * (radius * 0.6 + barHeight);

                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(animationRef.current!);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (audioContext.state !== 'closed') audioContext.close();
        };
    }, [stream, isRecording]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="w-full h-64 pointer-events-none"
        />
    );
}
