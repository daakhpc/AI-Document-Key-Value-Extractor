
import React, { useState, useEffect, useRef } from 'react';

interface TableConfigurationProps {
    keys: string[];
    onCreateTable: (orderedKeys: string[]) => void;
}

const TableConfiguration: React.FC<TableConfigurationProps> = ({ keys, onCreateTable }) => {
    const [orderedKeys, setOrderedKeys] = useState(keys);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    useEffect(() => {
        setOrderedKeys(keys);
    }, [keys]);

    const handleDragStart = (index: number) => {
        dragItem.current = index;
    };

    const handleDragEnter = (index: number) => {
        dragOverItem.current = index;
    };

    const handleDragEnd = () => {
        if (dragItem.current !== null && dragOverItem.current !== null) {
            const newOrderedKeys = [...orderedKeys];
            const draggedItemContent = newOrderedKeys.splice(dragItem.current, 1)[0];
            newOrderedKeys.splice(dragOverItem.current, 0, draggedItemContent);
            dragItem.current = null;
            dragOverItem.current = null;
            setOrderedKeys(newOrderedKeys);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Configure & Create Table</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Drag and drop to reorder columns, then click "Create Table" to view the data.</p>

            <div className="flex flex-wrap gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-md min-h-[4rem]">
                {orderedKeys.map((key, index) => (
                    <div
                        key={key}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragEnter={() => handleDragEnter(index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className="flex items-center space-x-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 rounded-full cursor-grab active:cursor-grabbing"
                    >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        <span className="text-sm font-medium select-none">{key}</span>
                    </div>
                ))}
            </div>

            <div className="mt-6 text-right">
                <button
                    onClick={() => onCreateTable(orderedKeys)}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Create Table
                </button>
            </div>
        </div>
    );
};

export default TableConfiguration;
