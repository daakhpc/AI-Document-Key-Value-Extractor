
import React from 'react';

interface KeySelectorProps {
    allKeys: string[];
    selectedKeys: Set<string>;
    onKeySelectionChange: (key: string) => void;
}

const KeySelector: React.FC<KeySelectorProps> = ({ allKeys, selectedKeys, onKeySelectionChange }) => {
    if (allKeys.length === 0) {
        return null;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Select table header</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-60 overflow-y-auto pr-2">
                {allKeys.map(key => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer text-sm">
                        <input
                            type="checkbox"
                            checked={selectedKeys.has(key)}
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
