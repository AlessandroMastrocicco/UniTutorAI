
import React, { useRef, useState, useCallback } from 'react';

interface FileUploaderProps {
    onFileChange: (file: File | null) => void;
}

const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);

export const FileUploader: React.FC<FileUploaderProps> = ({ onFileChange }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = (files: FileList | null) => {
        if (files && files.length > 0) {
            onFileChange(files[0]);
        }
    };

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);
    
    const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    const handleClick = () => {
        inputRef.current?.click();
    };

    return (
        <div className="w-full max-w-2xl text-center">
            <label
                onClick={handleClick}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-gray-800' : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800'}`}
            >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadIcon />
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Clicca per caricare</span> o trascina e rilascia</p>
                    <p className="text-xs text-gray-500">Solo file PDF</p>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,application/pdf"
                    onChange={(e) => handleFileSelect(e.target.files)}
                />
            </label>
        </div>
    );
};
