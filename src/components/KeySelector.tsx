import React, { useState, useEffect, useRef } from 'react';

interface HeaderConfigurationProps {
    suggestedHeaders: string[];
    onConfigComplete: (orderedHeaders: string[]) => void;
}

const HeaderConfiguration: React.FC<HeaderConfigurationProps> = ({ suggestedHeaders, onConfigComplete }) => {
    const [selectedHeaders, setSelectedHeaders] = useState<Set<string>>(new Set());
    const [orderedHeaders, setOrderedHeaders] = useState<string[]>([]);
    
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setSelectedHeaders(new Set(suggestedHeaders));
        setOrderedHeaders(suggestedHeaders);
    }, [suggestedHeaders]);

    const handleSelectionChange = (header: string) => {
        const newSelection = new Set(selectedHeaders);
        if (newSelection.has(header)) {
            newSelection.delete(header);
        } else {
            newSelection.add(header);
        }
        setSelectedHeaders(newSelection);
        setOrderedHeaders(suggestedHeaders.filter(h => newSelection.has(h)));
    };
    
    const handleSelectAll = () => {
        const newSelection = new Set(suggestedHeaders);
        setSelectedHeaders(newSelection);
        setOrderedHeaders(suggestedHeaders);
    };

    const handleDeselectAll = () => {
        setSelectedHeaders(new Set());
        setOrderedHeaders([]);
    };
    
    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const newOrderedHeaders = [...orderedHeaders];
            const draggedItem = newOrderedHeaders.splice(dragItem.current, 1)[0];
            newOrderedHeaders.splice(dragOverItem.current, 0, draggedItem);
            setOrderedHeaders(newOrderedHeaders);
        }
        dragItem.current = null;
        dragOverItem.current = null;
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Step 2: Configure Headers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Selection Panel */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Select Headers to Extract</h3>
                        <div className="space-x-2">
                            <button onClick={handleSelectAll} className="text-sm text-indigo-600 dark:text-indigo-400">Select All</button>
                            <button onClick={handleDeselectAll} className="text-sm text-indigo-600 dark:text-indigo-400">Deselect All</button>
                        </div>
                    </div>
                    <div className="p-2 border rounded-md max-h-72 overflow-y-auto space-y-2">
                        {suggestedHeaders.map(header => (
                            <label key={header} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                <input type="checkbox" checked={selectedHeaders.has(header)} onChange={() => handleSelectionChange(header)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <span>{header}</span>
                            </label>
                        ))}
                    </div>
                </div>
                {/* Ordering Panel */}
                <div className="space-y-4">
                     <h3 className="font-semibold">Order Columns</h3>
                     <div className="p-2 border rounded-md max-h-72 overflow-y-auto space-y-2 min-h-[4rem]">
                        <p className="text-xs text-gray-500 mb-2">Default headers (not removable): S.No, Document Name</p>
                        {orderedHeaders.map((header, index) => (
                             <div key={header} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                                 className="flex items-center space-x-2 p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded cursor-grab active:cursor-grabbing">
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                                <span>{header}</span>
                             </div>
                        ))}
                     </div>
                </div>
            </div>
            <div className="text-right">
                <button onClick={() => onConfigComplete(orderedHeaders)} className="px-6 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Confirm Headers &amp; Proceed</button>
            </div>
        </div>
    );
};

export default HeaderConfiguration;
