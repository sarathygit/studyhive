import { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function Whiteboard({ roomId }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#f59e0b');
    const [strokeWidth, setStrokeWidth] = useState(3);
    const [tool, setTool] = useState('draw'); // draw, erase
    const [strokes, setStrokes] = useState([]);
    const currentStroke = useRef([]);
    const { socket } = useSocket();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            const rect = canvas.parentElement.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            redrawAll();
        };

        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('drawStroke', (stroke) => {
            setStrokes(prev => [...prev, stroke]);
            drawStroke(stroke);
        });

        socket.on('clearCanvas', () => {
            setStrokes([]);
            clearCanvasLocal();
        });

        socket.on('undoStroke', () => {
            setStrokes(prev => {
                const newStrokes = prev.slice(0, -1);
                clearCanvasLocal();
                newStrokes.forEach(s => drawStroke(s));
                return newStrokes;
            });
        });

        return () => {
            socket.off('drawStroke');
            socket.off('clearCanvas');
            socket.off('undoStroke');
        };
    }, [socket]);

    const redrawAll = useCallback(() => {
        clearCanvasLocal();
        strokes.forEach(s => drawStroke(s));
    }, [strokes]);

    const getPos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        e.preventDefault();
        setIsDrawing(true);
        const pos = getPos(e);
        currentStroke.current = [pos];

        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();

        const pos = getPos(e);
        currentStroke.current.push(pos);

        const ctx = canvasRef.current.getContext('2d');
        ctx.lineWidth = tool === 'erase' ? strokeWidth * 4 : strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = tool === 'erase' ? '#1a1b21' : color;
        ctx.globalCompositeOperation = tool === 'erase' ? 'destination-out' : 'source-over';

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        const stroke = {
            points: currentStroke.current,
            color: tool === 'erase' ? 'erase' : color,
            width: tool === 'erase' ? strokeWidth * 4 : strokeWidth
        };

        setStrokes(prev => [...prev, stroke]);

        if (socket) {
            socket.emit('drawStroke', { roomId, stroke });
        }

        currentStroke.current = [];
    };

    const drawStroke = (stroke) => {
        const canvas = canvasRef.current;
        if (!canvas || !stroke.points || stroke.points.length < 2) return;

        const ctx = canvas.getContext('2d');
        ctx.beginPath();
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (stroke.color === 'erase') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = '#000';
        } else {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = stroke.color;
        }

        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
    };

    const clearCanvasLocal = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleClear = () => {
        setStrokes([]);
        clearCanvasLocal();
        if (socket) socket.emit('clearCanvas', { roomId });
    };

    const handleUndo = () => {
        setStrokes(prev => {
            const newStrokes = prev.slice(0, -1);
            clearCanvasLocal();
            newStrokes.forEach(s => drawStroke(s));
            return newStrokes;
        });
        if (socket) socket.emit('undoStroke', { roomId });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-3 p-3 border-b border-dark-100 dark:border-dark-800 flex-wrap">
                <div className="flex gap-1">
                    <button
                        onClick={() => setTool('draw')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tool === 'draw' ? 'bg-honey-500 text-white' : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300'
                            }`}
                    >
                        ✏️ Draw
                    </button>
                    <button
                        onClick={() => setTool('erase')}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tool === 'erase' ? 'bg-honey-500 text-white' : 'bg-dark-100 dark:bg-dark-800 text-dark-600 dark:text-dark-300'
                            }`}
                    >
                        🧹 Erase
                    </button>
                </div>

                <div className="h-6 w-px bg-dark-200 dark:bg-dark-700" />

                {/* Colors */}
                <div className="flex gap-1.5">
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => { setColor(c); setTool('draw'); }}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c && tool === 'draw' ? 'border-dark-900 dark:border-white scale-110' : 'border-transparent'
                                }`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>

                <div className="h-6 w-px bg-dark-200 dark:bg-dark-700" />

                {/* Stroke Width */}
                <input
                    type="range"
                    min="1"
                    max="10"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                    className="w-20 accent-honey-500"
                />

                <div className="flex-1" />

                <button onClick={handleUndo} className="btn-ghost text-sm">↩ Undo</button>
                <button onClick={handleClear} className="btn-ghost text-sm text-red-500 hover:text-red-600">🗑 Clear</button>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-white dark:bg-dark-950 cursor-crosshair relative">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="absolute inset-0"
                />
            </div>
        </div>
    );
}
