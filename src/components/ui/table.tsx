import React from 'react';

export const Table = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableElement>) => (
  <table className={`min-w-full w-max text-sm ${className}`} {...props}>
    {children}
  </table>
);

export const TableHeader = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`bg-gray-50 dark:bg-gray-800/50 ${className}`} {...props}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${className}`} {...props}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHead = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${className}`} {...props}>
    {children}
  </td>
);