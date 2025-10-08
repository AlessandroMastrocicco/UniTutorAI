
import React, { useRef, useEffect, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy } from '../types';

interface PdfViewerProps {
    pdfDoc: PDFDocumentProxy;
    pageNumber: number;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ pdfDoc, pageNumber }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isRendering, setIsRendering] = useState(false);

    useEffect(() => {
        if (!pdfDoc) return;

        let renderTask: ReturnType<PDFPageProxy['render']> | null = null;
        let isCancelled = false;

        const renderPage = async () => {
            setIsRendering(true);
            try {
                const page = await pdfDoc.getPage(pageNumber);
                if (isCancelled) return;

                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                if (!context) return;
                
                const viewport = page.getViewport({ scale: 1.5 });
                
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                renderTask = page.render(renderContext);
                await renderTask.promise;
            } catch (error) {
                if ((error as Error).name !== 'RenderingCancelledException') {
                    console.error("Error rendering page:", error);
                }
            } finally {
                if (!isCancelled) {
                    setIsRendering(false);
                }
            }
        };

        renderPage();
        
        return () => {
            isCancelled = true;
            if (renderTask) {
                (renderTask as any).cancel();
            }
        };
    }, [pdfDoc, pageNumber]);

    return (
        <div className="relative w-full flex justify-center my-4">
            {isRendering && (
                <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
            )}
            <canvas ref={canvasRef} className="rounded-lg shadow-lg" style={{maxWidth: '100%'}}></canvas>
        </div>
    );
};
