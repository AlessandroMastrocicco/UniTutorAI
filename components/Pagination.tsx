
import React, { useState, useEffect } from 'react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
    const [inputValue, setInputValue] = useState(currentPage.toString());

    useEffect(() => {
        setInputValue(currentPage.toString());
    }, [currentPage]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const pageNum = parseInt(inputValue, 10);
        if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
            onPageChange(pageNum);
        } else {
            setInputValue(currentPage.toString());
        }
    };
    
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleInputBlur();
        }
    };
    
    const goToPrev = () => onPageChange(currentPage - 1);
    const goToNext = () => onPageChange(currentPage + 1);

    return (
        <div className="w-full flex justify-center items-center space-x-2 sm:space-x-4 p-2 bg-gray-900/50 rounded-lg">
            <button
                onClick={goToPrev}
                disabled={currentPage <= 1}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-700 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
                {'< Prec'}
            </button>
            
            <div className="flex items-center space-x-2 text-gray-300">
                <span>Pagina</span>
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyPress={handleKeyPress}
                    className="w-12 text-center bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <span>di {totalPages}</span>
            </div>

            <button
                onClick={goToNext}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-gray-700 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
            >
                {'Succ >'}
            </button>
        </div>
    );
};
