import React from 'react';
import { UploadedFile } from '../types';

interface DataTableProps {
    files: UploadedFile[];
    selectedKeys: Set<string>;
}

const DataTable: React.FC<DataTableProps> = ({ files, selectedKeys }) => {
    const sortedKeys = Array.from(selectedKeys).sort();

    if (files.length === 0 || sortedKeys.length === 0) {
        return (
             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md flex flex-col items-center justify-center text-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">No Data to Display</p>
                <p className="text-gray-500 dark:text-gray-400">Select one or more keys from the panel above to view the extracted data.</p>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider sticky left-0 bg-gray-50 dark:bg-gray-700 z-10">
                                Document
                            </th>
                            {sortedKeys.map(key => (
                                <th key={key} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {files.map(file => {
                            const dataMap = new Map(file.data?.map(item => [item.key, item.value]));
                            return (
                                <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className="truncate w-40" title={file.file.name}>{file.file.name}</div>
                                    </td>
                                    {sortedKeys.map(key => (
                                        <td key={key} className="px-6 py-4 whitespace-normal text-sm text-gray-600 dark:text-gray-300">
                                            {dataMap.get(key) || 'N/A'}
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