
import React from 'react';
import { UploadedFile } from '../types';

interface DataTableProps {
    files: UploadedFile[];
    displayedKeys: string[];
    keyGroups: Map<string, string[]>;
}

const DataTable: React.FC<DataTableProps> = ({ files, displayedKeys, keyGroups }) => {

    const escapeCsvCell = (cellData: string) => {
        const stringValue = String(cellData || '');
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };
    
    const findValueForDisplayKey = (dataMap: Map<string, string>, displayKey: string): string => {
        const originalKeys = keyGroups.get(displayKey) || [displayKey];
        for (const key of originalKeys) {
            if (dataMap.has(key)) {
                return dataMap.get(key) || 'N/A';
            }
        }
        return 'N/A';
    }

    const exportToCSV = () => {
        const headers = ['Document', ...displayedKeys];
        const csvRows = [headers.map(escapeCsvCell).join(',')];

        files.forEach(file => {
            const dataMap = new Map(file.data?.map(item => [item.key.trim(), item.value]));
            const rowData = displayedKeys.map(displayKey => findValueForDisplayKey(dataMap, displayKey));
            const row = [file.file.name, ...rowData];
            csvRows.push(row.map(escapeCsvCell).join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'extracted_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (files.length === 0 || displayedKeys.length === 0) {
        return null; 
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Extracted Data</h2>
                <button
                    onClick={exportToCSV}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Export as CSV
                </button>
            </div>
            <div className="max-h-[60vh] overflow-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 relative border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-20">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-30">
                                Document
                            </th>
                            {displayedKeys.map(key => (
                                <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {files.map(file => {
                            const dataMap = new Map(file.data?.map(item => [item.key.trim(), item.value]));
                            return (
                                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-inherit z-10">
                                        <div className="truncate max-w-xs" title={file.file.name}>{file.file.name}</div>
                                    </td>
                                    {displayedKeys.map(displayKey => (
                                        <td key={displayKey} className="px-6 py-4 whitespace-normal text-sm text-gray-600 dark:text-gray-300">
                                            {findValueForDisplayKey(dataMap, displayKey)}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
