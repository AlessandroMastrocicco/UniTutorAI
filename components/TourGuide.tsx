import React, { useState, useLayoutEffect, useEffect, useRef, useCallback } from 'react';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

export interface TourStep {
  selector: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
  steps: TourStep[];
  t: (key: string) => string;
}

export const TourGuide: React.FC<TourGuideProps> = ({ isOpen, onClose, steps, t }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0 });
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Effect to control body scroll and reset tour state
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setCurrentStep(0); // Always start from the first step
        } else {
            document.body.style.overflow = 'auto';
        }

        // Cleanup function
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);
    
    const calculateTooltipPosition = useCallback((targetRect: DOMRect, tooltipEl: HTMLDivElement) => {
        const { width: tooltipWidth, height: tooltipHeight } = tooltipEl.getBoundingClientRect();
        const preferredPosition = steps[currentStep]?.position || 'bottom';
        const margin = 16;
        const { innerWidth: vw, innerHeight: vh } = window;
        
        const positions = {
            bottom: {
                top: targetRect.bottom + margin,
                left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            },
            top: {
                top: targetRect.top - tooltipHeight - margin,
                left: targetRect.left + targetRect.width / 2 - tooltipWidth / 2,
            },
            right: {
                top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
                left: targetRect.right + margin,
            },
            left: {
                top: targetRect.top + targetRect.height / 2 - tooltipHeight / 2,
                left: targetRect.left - tooltipWidth - margin,
            },
        };

        const checkFits = (posName: 'top' | 'bottom' | 'left' | 'right') => {
            const pos = positions[posName];
            return (
                pos.top >= margin &&
                pos.left >= margin &&
                pos.top + tooltipHeight <= vh - margin &&
                pos.left + tooltipWidth <= vw - margin
            );
        };
        
        const preferenceOrder: ('top' | 'bottom' | 'left' | 'right')[] = [
            preferredPosition,
            ...(preferredPosition === 'bottom' ? ['top', 'right', 'left'] :
              preferredPosition === 'top' ? ['bottom', 'right', 'left'] :
              preferredPosition === 'right' ? ['left', 'bottom', 'top'] :
              ['right', 'bottom', 'top'])
        ].filter((v, i, a) => a.indexOf(v) === i) as any;

        let bestPositionKey = preferenceOrder[0];
        for (const posName of preferenceOrder) {
            if (checkFits(posName)) {
                bestPositionKey = posName;
                break;
            }
        }
        
        let { top, left } = positions[bestPositionKey];

        // Clamp values to be within viewport
        left = Math.max(margin, Math.min(left, vw - tooltipWidth - margin));
        top = Math.max(margin, Math.min(top, vh - tooltipHeight - margin));

        setTooltipStyle({
            position: 'absolute',
            top: `${top}px`,
            left: `${left}px`,
            maxWidth: '320px',
            zIndex: 102,
            opacity: 1,
            transition: 'opacity 0.3s ease-in-out, top 0.3s ease-in-out, left 0.3s ease-in-out',
        });

    }, [currentStep, steps]);

    useLayoutEffect(() => {
        if (isOpen && steps[currentStep]) {
            const element = document.querySelector(steps[currentStep].selector);
            const tooltipEl = tooltipRef.current;

            if (element && tooltipEl) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });

                const updatePosition = () => {
                    const rect = element.getBoundingClientRect();
                    setHighlightRect(rect);
                    calculateTooltipPosition(rect, tooltipEl);
                };
                
                // Use IntersectionObserver with a fallback timeout for robustness
                const observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) {
                        updatePosition();
                        observer.disconnect();
                    }
                }, { threshold: 0.8 }); // Trigger when 80% is visible
                observer.observe(element);
                
                const scrollTimeout = setTimeout(() => {
                    observer.disconnect();
                    updatePosition();
                }, 350);

                return () => {
                    clearTimeout(scrollTimeout);
                    observer.disconnect();
                };
            } else {
                onClose();
            }
        } else {
            setHighlightRect(null);
            setTooltipStyle({ opacity: 0 });
        }
    }, [isOpen, currentStep, steps, onClose, calculateTooltipPosition]);

    const handleNext = () => {
        setTooltipStyle(s => ({...s, opacity: 0})); // Hide tooltip during transition
        if (currentStep < steps.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            onClose();
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!isOpen) return null;

    const step = steps[currentStep];

    return (
        <div className="fixed inset-0 z-[100]">
            {highlightRect && (
                <div
                    style={{
                        position: 'absolute',
                        top: `${highlightRect.top - 8}px`,
                        left: `${highlightRect.left - 8}px`,
                        width: `${highlightRect.width + 16}px`,
                        height: `${highlightRect.height + 16}px`,
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
                        borderRadius: '16px',
                        zIndex: 101,
                        pointerEvents: 'none',
                        transition: 'all 0.3s ease-in-out',
                    }}
                />
            )}

            <div ref={tooltipRef} style={tooltipStyle}>
                {step && (
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-4 border border-gray-700">
                        <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                        <div className="text-sm text-gray-300 mb-4" dangerouslySetInnerHTML={{ __html: step.content }} />
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">{currentStep + 1} / {steps.length}</span>
                            <div>
                                <button onClick={handleSkip} className="text-sm text-gray-400 hover:text-white mr-4">
                                    {t('onboarding.skipTourButton')}
                                </button>
                                <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg text-sm">
                                    {currentStep < steps.length - 1 ? t('onboarding.continueButton') : 'Fine'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
