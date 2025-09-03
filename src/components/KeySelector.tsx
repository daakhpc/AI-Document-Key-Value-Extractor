
import React from 'react';

interface KeySelectorProps {
    allKeys: Set<string>;
    checkedKeys: Set<string>;
    onKeySelectionChange: (key: string) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

const KeySelector: React.FC<KeySelectorProps> = ({ allKeys, checkedKeys, onKeySelectionChange, onSelectAll, onDeselectAll }) => {
    const sortedKeys = Array.from(allKeys).sort();

    if (sortedKeys.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Select Data Points</h2>
                 <div className="flex space-x-3">
                    <button onClick={onSelectAll} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none">
                        Select All
                    </button>
                    <button onClick={onDeselectAll} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline focus:outline-none">
                        Deselect All
                    </button>
                 </div>
            </div>
           
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto pr-2">
                {sortedKeys.map(key => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer text-sm">
                        <input
                            type="checkbox"
                            checked={checkedKeys.has(key)}
                            onChange={() => onKeySelectionChange(key)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300 select-none truncate" title={key}>{key}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default KeySelector;
