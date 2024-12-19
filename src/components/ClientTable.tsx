import React, { useState } from 'react';
import { Edit, Trash2, Eye, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface ClientTableProps {
  clients: Client[];
  searchTerm: string;
  onEdit: (client: Client) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onView: (client: Client) => Promise<void>;
}

export const ClientTable: React.FC<ClientTableProps> = ({
  clients = [],
  searchTerm,
  onEdit,
  onDelete,
  onView,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingClientId, setLoadingClientId] = useState<{ [key: string]: string | null }>({
    view: null,
    edit: null,
    delete: null,
  });
  const itemsPerPage = 10;

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const paginatedClients = filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleButtonClick = async (action: () => Promise<void>, clientId: string, type: 'view' | 'edit' | 'delete') => {
    setLoadingClientId(prev => ({ ...prev, [type]: clientId }));
    try {
      await action();
    } finally {
      setLoadingClientId(prev => ({ ...prev, [type]: null }));
    }
  };

  return (
    <div className="w-full overflow-auto">
      <div className="inline-block min-w-full align-middle">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-sm md:text-base">Name</TableHead>
              <TableHead className="text-sm md:text-base">Email</TableHead>
              <TableHead className="text-sm md:text-base">Phone</TableHead>
              <TableHead className="text-sm md:text-base">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedClients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="text-xs md:text-sm">{client.name}</TableCell>
                <TableCell className="text-xs md:text-sm">{client.email}</TableCell>
                <TableCell className="text-xs md:text-sm">{client.phone}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleButtonClick(() => onView(client), client.id, 'view')}
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-1"
                      disabled={loadingClientId.view === client.id}
                    >
                      {loadingClientId.view === client.id ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Eye className="h-8 w-8 text-black" />
                      )}
                    </Button>
                    <Button
                      onClick={() => handleButtonClick(() => onEdit(client), client.id, 'edit')}
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-1"
                      disabled={loadingClientId.edit === client.id}
                    >
                      {loadingClientId.edit === client.id ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Edit className="h-8 w-8 text-black" />
                      )}
                    </Button>
                    <Button
                      onClick={() => handleButtonClick(() => onDelete(client.id), client.id, 'delete')}
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-1"
                      disabled={loadingClientId.delete === client.id}
                    >
                      {loadingClientId.delete === client.id ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Trash2 className="h-8 w-8 text-black" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button onClick={handlePreviousPage} disabled={currentPage === 1}>
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
          Next
        </Button>
      </div>
    </div>
  );
};