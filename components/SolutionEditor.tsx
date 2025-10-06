import React, { useState, useEffect, useRef, useCallback } from 'react';

// Icons
const PencilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>;
const TextIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2 0h2v2h-2V9zm2-4h-2v2h2V5z" clipRule="evenodd" /></svg>;
const EraserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zM9 11a1 1 0 100-2H7a1 1 0 100 2h2zm2-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 100-2H7a1 1 0 100 2h2zm2 4a1 1 0 100-2H7a1 1 0 100 2h4z" clipRule="evenodd" /></svg>;
const ExpandIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4h4m12 4V4h-4M4 16v4h4m12-4v4h-4" /></svg>;
const CollapseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 4h5v5M4 9V4h5M15 20h5v-5M4 15v5h5" /></svg>;
const EnlargeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>;


export const SolutionEditor: React.FC<{
    initialContent: string;
    onSave: (content: string) => void;
    isExpanded: boolean;
    onToggleExpand: () => void;
}> = ({ initialContent, onSave, isExpanded, onToggleExpand }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const editorWrapperRef = useRef<HTMLDivElement>(null);
    const isDrawing = useRef(false);
    const lastPoint = useRef<{x: number, y: number} | null>(null);

    const [mode, setMode] = useState<'text' | 'draw' | 'erase'>('text');
    const [penColor, setPenColor] = useState('#FFFFFF');
    const [penSize, setPenSize] = useState(3);
    const [editorMinHeight, setEditorMinHeight] = useState(300);

    const onSaveRef = useRef(onSave);
    useEffect(() => {
        onSaveRef.current = onSave;
    }, [onSave]);
    
    const saveTimeoutRef = useRef<number | null>(null);

    const performSave = useCallback(() => {
        if (!editorRef.current) return;

        const htmlContent = editorRef.current.innerHTML;
        const canvas = canvasRef.current;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        
        tempDiv.querySelectorAll('[data-ocr-status], div[data-drawing-layer]').forEach(el => el.remove());
        
        let finalHtml = tempDiv.innerHTML;

        if (canvas) {
            const drawingDataUrl = canvas.toDataURL();
            const blankCanvas = document.createElement('canvas');
            blankCanvas.width = canvas.width;
            blankCanvas.height = canvas.height;
            if (drawingDataUrl !== blankCanvas.toDataURL()) {
                finalHtml += `<div data-drawing-layer="${drawingDataUrl}" style="display: none;"></div>`;
            }
        }
        
        onSaveRef.current(finalHtml);
    }, []);

    const saveContentDebounced = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        saveTimeoutRef.current = window.setTimeout(() => {
            performSave();
        }, 1000);
    }, [performSave]);

    const saveContentImmediate = useCallback(() => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }
        performSave();
    }, [performSave]);


    useEffect(() => {
        if (editorRef.current) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = initialContent;
    
            const drawingElement = tempDiv.querySelector('div[data-drawing-layer]');
            const canvas = canvasRef.current;
    
            if (drawingElement && canvas) {
                const dataUrl = drawingElement.getAttribute('data-drawing-layer');
                if (dataUrl) {
                    const ctx = canvas.getContext('2d');
                    const img = new Image();
                    img.onload = () => {
                        if (ctx) {
                            // Ensure canvas is sized before drawing
                            canvas.width = editorWrapperRef.current?.offsetWidth || canvas.width;
                            canvas.height = editorWrapperRef.current?.offsetHeight || canvas.height;
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            ctx.drawImage(img, 0, 0);
                        }
                    };
                    img.src = dataUrl;
                }
                drawingElement.remove();
            } else if (canvas) {
                // If no drawing data is found, clear the canvas
                const ctx = canvas.getContext('2d');
                ctx?.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            editorRef.current.innerHTML = tempDiv.innerHTML;
        }
    }, [initialContent]);

    // OCR on pasted images
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(async (node) => {
                    if (node.nodeName === 'IMG' && !(node as HTMLImageElement).dataset.ocrStatus) {
                        const img = node as HTMLImageElement;
                        img.dataset.ocrStatus = 'processing';
                        
                        const ocrStatusEl = document.createElement('div');
                        ocrStatusEl.setAttribute('data-ocr-status', 'processing');
                        ocrStatusEl.className = 'text-sm text-yellow-400 italic p-2 bg-gray-800 rounded-b-md text-center';
                        ocrStatusEl.innerHTML = `<div class="flex items-center justify-center"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-400 mr-2"></div>Analisi OCR in corso...</div>`;
                        img.after(ocrStatusEl);

                        try {
                            const Tesseract = (window as any).Tesseract;
                            if (!Tesseract) throw new Error("Tesseract.js non è caricato.");

                            const worker = await Tesseract.createWorker('ita');
                            const { data: { text } } = await worker.recognize(img.src);
                            await worker.terminate();

                            if (text && text.trim()) {
                                const blockquote = document.createElement('blockquote');
                                blockquote.className = 'ocr-text border-l-4 border-gray-500 pl-4 my-2 italic text-gray-400';
                                blockquote.innerText = text;
                                ocrStatusEl.replaceWith(blockquote);
                            } else {
                                ocrStatusEl.remove();
                            }
                            img.dataset.ocrStatus = 'complete';

                        } catch (err) {
                            console.error("OCR fallito:", err);
                            ocrStatusEl.innerHTML = 'Analisi OCR fallita.';
                            ocrStatusEl.className = 'text-sm text-red-400 italic p-2 bg-red-900/50 rounded-b-md text-center';
                            ocrStatusEl.setAttribute('data-ocr-status', 'failed');
                            img.dataset.ocrStatus = 'failed';
                        } finally {
                            saveContentImmediate();
                        }
                    }
                });
            });
        });

        observer.observe(editor, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, [saveContentImmediate]);

    // Resize canvas to match editor size, preserving content
    useEffect(() => {
        const wrapper = editorWrapperRef.current;
        const canvas = canvasRef.current;
        if (!wrapper || !canvas) return;

        let animationFrameId: number;

        const resizeObserver = new ResizeObserver(entries => {
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = window.requestAnimationFrame(() => {
                for (const entry of entries) {
                    const { width, height } = entry.contentRect;
                    if (canvas.width !== width || canvas.height !== height) {
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = canvas.width;
                        tempCanvas.height = canvas.height;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (tempCtx) {
                            tempCtx.drawImage(canvas, 0, 0);
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(tempCanvas, 0, 0);
                        }
                    }
                }
            });
        });
        resizeObserver.observe(wrapper);
        return () => {
            if (animationFrameId) {
                window.cancelAnimationFrame(animationFrameId);
            }
            resizeObserver.disconnect();
        };
    }, []);

    // Save content on unmount
    useEffect(() => {
        return () => {
            saveContentImmediate();
        };
    }, [saveContentImmediate]);

    const execCmd = (command: string, value: string | null = null) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
        saveContentDebounced();
    };
    
    const toggleMode = (newMode: 'text' | 'draw' | 'erase') => {
        if (mode !== 'text' && newMode === 'text') {
             saveContentImmediate();
        }
        setMode(newMode);
    };
    
    const startDrawing = (e: React.PointerEvent) => {
        if (e.pointerType === 'touch' || !e.isPrimary) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
    
        canvas.setPointerCapture(e.pointerId);
        isDrawing.current = true;
        
        const currentPoint = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        lastPoint.current = currentPoint;
    
        const pressure = e.pointerType === 'pen' ? Math.max(0.1, e.pressure) : 1;
        const size = (mode === 'erase' ? penSize * 3 : penSize * pressure);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    
        if (mode === 'draw') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = penColor;
            ctx.beginPath();
            ctx.arc(currentPoint.x, currentPoint.y, (size > 0.5 ? size : 0.5) / 2, 0, 2 * Math.PI);
            ctx.fill();
        } else {
            const eraserSize = penSize * 1.5;
            ctx.clearRect(currentPoint.x - eraserSize, currentPoint.y - eraserSize, eraserSize * 2, eraserSize * 2);
        }
    };
    
    const draw = (e: React.PointerEvent) => {
        if (!isDrawing.current || !e.isPrimary) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !lastPoint.current) return;
    
        const currentPoint = { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
        const pressure = e.pointerType === 'pen' ? Math.max(0.1, e.pressure) : 1;
    
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    
        if (mode === 'draw') {
            ctx.globalCompositeOperation = 'source-over';
            ctx.strokeStyle = penColor;
            ctx.lineWidth = penSize * pressure;
        } else {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.lineWidth = penSize * 3;
        }
    
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(currentPoint.x, currentPoint.y);
        ctx.stroke();
    
        lastPoint.current = currentPoint;
    };
    
    const stopDrawing = (e: React.PointerEvent) => {
        if (!e.isPrimary || !isDrawing.current) return;
    
        isDrawing.current = false;
        lastPoint.current = null;
        
        const canvas = canvasRef.current;
        if (canvas && canvas.hasPointerCapture(e.pointerId)) {
            canvas.releasePointerCapture(e.pointerId);
        }
        saveContentDebounced();
    };

    return (
        <div className="flex-grow flex flex-col h-full">
            <div className="flex-shrink-0 flex flex-wrap items-center gap-1 sm:gap-2 p-2 bg-gray-900/50 border-b border-gray-700">
                <select onChange={e => execCmd('formatBlock', e.target.value)} className="bg-gray-700 text-white text-xs rounded p-1.5 focus:outline-none">
                    <option value="p">Paragrafo</option><option value="h1">Titolo 1</option><option value="h2">Titolo 2</option><option value="h3">Titolo 3</option>
                </select>
                <button onClick={() => execCmd('bold')} className="p-1.5 hover:bg-gray-700 rounded" title="Grassetto"><b>B</b></button>
                <button onClick={() => execCmd('italic')} className="p-1.5 hover:bg-gray-700 rounded" title="Corsivo"><i>I</i></button>
                <button onClick={() => execCmd('underline')} className="p-1.5 hover:bg-gray-700 rounded" title="Sottolineato"><u>U</u></button>
                <label className="p-1.5 hover:bg-gray-700 rounded cursor-pointer" title="Colore Testo">🎨<input type="color" className="w-0 h-0 opacity-0" onChange={e => execCmd('foreColor', e.target.value)} /></label>
                <div className="border-l h-6 border-gray-600 mx-1"></div>
                <button onClick={() => toggleMode('text')} className={`p-1.5 rounded flex items-center gap-1 text-sm ${mode === 'text' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}><TextIcon /> Testo</button>
                <button onClick={() => toggleMode('draw')} className={`p-1.5 rounded flex items-center gap-1 text-sm ${mode === 'draw' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}><PencilIcon /> Disegna</button>
                <button onClick={() => toggleMode('erase')} className={`p-1.5 rounded flex items-center gap-1 text-sm ${mode === 'erase' ? 'bg-indigo-600' : 'hover:bg-gray-700'}`}><EraserIcon /> Gomma</button>
                <div className="border-l h-6 border-gray-600 mx-1"></div>
                <button onClick={() => setEditorMinHeight(h => h * 2)} className="p-1.5 hover:bg-gray-700 rounded" title="Raddoppia area di scrittura"><EnlargeIcon /></button>
                <button onClick={onToggleExpand} className="p-1.5 hover:bg-gray-700 rounded" title={isExpanded ? 'Riduci pannello' : 'Espandi pannello'}>
                    {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                </button>
                {(mode === 'draw' || mode === 'erase') && <>
                    <label className="p-1.5 hover:bg-gray-700 rounded cursor-pointer" title="Colore Pennello">🖌️<input type="color" value={penColor} className="w-0 h-0 opacity-0" onChange={e => setPenColor(e.target.value)} /></label>
                    <input type="range" min="1" max="20" value={penSize} onChange={e => setPenSize(parseInt(e.target.value, 10))} className="w-20" title="Dimensione Pennello"/>
                </>}
            </div>
            
            <div ref={editorWrapperRef} className="relative flex-grow bg-gray-700/50 rounded-b-md overflow-y-auto">
                <div
                    ref={editorRef}
                    contentEditable={mode === 'text'}
                    onBlur={saveContentImmediate}
                    onInput={saveContentDebounced}
                    className="w-full h-full p-3 focus:outline-none"
                    style={{ minHeight: `${editorMinHeight}px`, caretColor: mode === 'text' ? 'white' : 'transparent' }}
                />
                <canvas
                    ref={canvasRef}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerCancel={stopDrawing}
                    onPointerLeave={stopDrawing}
                    className="absolute top-0 left-0"
                    style={{ pointerEvents: mode === 'text' ? 'none' : 'auto', cursor: 'crosshair', touchAction: 'none' }}
                />
            </div>
        </div>
    );
};