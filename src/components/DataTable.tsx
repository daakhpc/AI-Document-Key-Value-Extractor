import React, { useState, useMemo } from 'react';
import { TableRow } from '../types';

interface DataTableProps {
    headers: string[];
    data: TableRow[];
    isExtracting: boolean;
}

type SortConfig = {
    key: string;
    direction: 'ascending' | 'descending';
} | null;

const useSortableData = (items: TableRow[], config: SortConfig = null) => {
    const sortedItems = useMemo(() => {
        let sortableItems = [...items];
        if (config !== null) {
            sortableItems.sort((a, b) => {
                const valA = a[config.key];
                const valB = b[config.key];
                if (valA === undefined || valB === undefined) return 0;
                if (valA < valB) return config.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return config.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [items, config]);

    return sortedItems;
};

// FIX: Define a new interface for the DataTable component that includes the ExportButton static property.
// This resolves TypeScript errors when attaching ExportButton to the DataTable component and using it in App.tsx.
interface DataTableComponent extends React.FC<DataTableProps> {
    ExportButton: React.FC<{ data: TableRow[], headers: string[] }>;
}

const DataTable: DataTableComponent = ({ headers, data, isExtracting }) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>(null);
    const sortedData = useSortableData(data, sortConfig);

    const requestSort = (key: string) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    if (data.length === 0 && !isExtracting) {
        return (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center justify-center text-center h-64">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <p className="mt-4 font-semibold text-gray-700 dark:text-gray-300">No Data Yet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Upload documents to begin extraction.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {headers.map(header => (
                                <th key={header} scope="col" onClick={() => requestSort(header)}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedData.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                {headers.map(header => (
                                    <td key={header} className="px-6 py-4 whitespace-normal text-sm text-gray-600 dark:text-gray-300">
                                        {row[header] !== undefined ? String(row[header]) : 'N/A'}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {isExtracting && (
                             <tr className="bg-gray-50 dark:bg-gray-700/20">
                                 <td colSpan={headers.length} className="px-6 py-4 text-center">
                                     <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="w-4 h-4 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                                        <span>Extracting more data...</span>
                                     </div>
                                 </td>
                             </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const ExportButton: React.FC<{ data: TableRow[], headers: string[] }> = ({ data, headers }) => {
    const exportToCsv = () => {
        const headerRow = headers.join(',') + '\n';
        const csvRows = data.map(row => 
            headers.map(header => {
                const value = row[header] !== undefined ? String(row[header]) : '';
                // Escape commas and quotes
                const escaped = value.replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        ).join('\n');

        const blob = new Blob([headerRow + csvRows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'extracted_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <button onClick={exportToCsv} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md shadow-sm hover:bg-green-700">
            Export to CSV
        </button>
    );
};

DataTable.ExportButton = ExportButton;

export default DataTable;