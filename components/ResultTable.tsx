import React from 'react';
import { QueryResult, FontSize } from '../types';

interface ResultTableProps {
  data: QueryResult | null;
  title: string;
  emptyMessage?: string;
  isError?: boolean;
  fontSize: FontSize;
}

interface TableContainerProps {
  children: React.ReactNode;
  borderColor?: string;
  title: string;
  recordCount?: number;
}

const TableContainer: React.FC<TableContainerProps> = ({ children, borderColor = "border-slate-300 dark:border-slate-700", title, recordCount }) => (
  <div className={`flex flex-col h-full border ${borderColor} bg-white dark:bg-slate-900 shadow-sm`}>
    <div className={`px-3 py-2 border-b ${borderColor} bg-slate-50 dark:bg-slate-800 flex justify-between items-center`}>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">{title}</span>
      {recordCount !== undefined && (
        <span className="text-[10px] font-mono text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 rounded-sm">
          {recordCount}
        </span>
      )}
    </div>
    {children}
  </div>
);

const ResultTable: React.FC<ResultTableProps> = ({ data, title, emptyMessage = "Sem dados", isError = false, fontSize }) => {
  if (!data) {
    return (
      <TableContainer title={title}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
          <span className="text-xs font-mono uppercase tracking-widest">Aguardando...</span>
        </div>
      </TableContainer>
    );
  }

  if (isError) {
     return (
      <TableContainer title={title} borderColor="border-red-300 dark:border-red-800">
        <div className="p-4 bg-red-50 dark:bg-red-900/10 h-full overflow-auto">
          <pre className="text-red-700 dark:text-red-400 text-xs font-mono whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </TableContainer>
    );
  }

  if (data.length === 0) {
    return (
      <TableContainer title={title} recordCount={0}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400">
          <span className="text-sm">{emptyMessage}</span>
        </div>
      </TableContainer>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <TableContainer title={title} recordCount={data.length}>
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
        <table className={`w-full text-left whitespace-nowrap border-collapse ${fontSize}`}>
          <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10">
            <tr>
              {columns.map((col) => (
                <th key={col} className="px-4 py-2 font-bold text-slate-700 dark:text-slate-200 border-b border-r last:border-r-0 border-slate-300 dark:border-slate-700 text-xs tracking-tight">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-mono text-slate-700 dark:text-slate-300">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 even:bg-slate-50 dark:even:bg-slate-800/50">
                {columns.map((col) => (
                  <td key={`${i}-${col}`} className="px-4 py-2 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-800/50">
                    {String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TableContainer>
  );
};

export default ResultTable;