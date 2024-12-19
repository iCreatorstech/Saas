// SiteTable.tsx

import React, { useMemo } from 'react';
import { Edit, Trash2, Eye, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from '@tanstack/react-table';
import { Table } from 'rizzui';

interface Site {
  id: string;
  name: string;
  type: string;
  url: string;
  hostName: string;
  domainPurchasedFrom: string;
  expirationDate: string;
  nameChanged: boolean;
  amountPaid: number;
  amountUsedForCreation: number;
}

interface SiteTableProps {
  sites: Site[];
  onEdit: (site: Site) => void;
  onDelete: (id: string) => void;
  onView: (site: Site) => void;
}

export const SiteTable: React.FC<SiteTableProps> = ({
  sites = [],
  onEdit,
  onDelete,
  onView,
}) => {
  const columnHelper = createColumnHelper<Site>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('type', {
        header: 'Type',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('url', {
        header: 'URL',
        cell: (info) => (
          <a
            href={info.getValue()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {info.getValue()}
            <ExternalLink className="h-4 w-4" />
          </a>
        ),
      }),
      columnHelper.accessor('hostName', {
        header: 'Host',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('expirationDate', {
        header: 'Expiration Date',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('nameChanged', {
        header: 'Status',
        cell: (info) => (
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
              info.getValue()
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500'
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500'
            }`}
          >
            {info.getValue() ? 'Changed' : 'Original'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onView(info.row.original)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => onEdit(info.row.original)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Edit className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => onDelete(info.row.original.id)}
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        ),
      }),
    ],
    [onEdit, onDelete, onView]
  );

  const table = useReactTable({
    data: sites,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden">
        <Table.Body className="divide-y divide-gray-200 dark:divide-gray-700">
      <Table className="!shadow-none !border-0">
        <Table.Header className="!bg-gray-100 dark:!bg-gray-800 !border-y-0">
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <Table.Head
                  key={header.id}
                  className="!text-start"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </Table.Head>
              ))}
            </Table.Row>
          ))}
        </Table.Header>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              {row.getVisibleCells().map((cell) => (
                <Table.Cell
                  key={cell.id}
                  className="text-start px-4 py-3 text-sm text-gray-900 dark:text-gray-100"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
};
