import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FileDown, Edit, Trash2, Eye, X } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { format } from 'date-fns';
import ItemForm from '../components/ItemForm';
import ItemDetail from '../components/ItemDetail';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Inventory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { items, fetchItems, deleteItem, loading } = useInventory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  const action = searchParams.get('action');
  const editSerial = searchParams.get('edit');
  const viewSerial = searchParams.get('view');

  useEffect(() => {
    const filters = {};
    if (statusFilter) filters.status = statusFilter;
    if (typeFilter) filters.item_type = typeFilter;
    if (searchQuery) filters.search = searchQuery;
    fetchItems(filters);
  }, [searchQuery, statusFilter, typeFilter]);

  const handleDelete = async (serialNumber, itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(serialNumber, itemId);
        toast.success('Item deleted successfully');
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('KALICHINDI INVENTORY REPORT', 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, 105, 22, { align: 'center' });
    
    // Table
    const tableData = items.map(item => [
      item.serial_number,
      item.item_type,
      item.issuer_name,
      item.issued_to_name,
      item.location,
      item.status,
    ]);
    
    doc.autoTable({
      head: [['Serial #', 'Type', 'Issuer', 'Issued To', 'Location', 'Status']],
      body: tableData,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [75, 83, 32], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    
    doc.save(`inventory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF exported successfully');
  };

  const uniqueTypes = [...new Set(items.map(item => item.item_type))].filter(Boolean);

  const statusColors = {
    'Serviceable': 'text-green-400 bg-green-500/10 border-green-500',
    'Pending Repair': 'text-yellow-400 bg-yellow-500/10 border-yellow-500',
    'Beyond Economic Repair': 'text-red-400 bg-red-500/10 border-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-heading font-bold uppercase tracking-tight" data-testid="inventory-title">
            Inventory Management
          </h2>
          <p className="text-sm font-mono text-muted-foreground mt-1 uppercase tracking-wider">
            {items.length} Total Items
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-olive-500 bg-olive-500/10 text-olive-500 hover:bg-olive-500 hover:text-white transition-colors duration-100"
            data-testid="export-pdf-button"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
          <button
            onClick={() => setSearchParams({ action: 'add' })}
            className="flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-olive-500 bg-olive-500 text-white hover:bg-olive-600 transition-colors duration-100"
            data-testid="add-new-item-button"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by serial, issuer, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 rounded-none border-b-2 border-zinc-700 bg-transparent text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
            data-testid="search-input"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
          data-testid="status-filter"
        >
          <option value="">All Statuses</option>
          <option value="Serviceable">Serviceable</option>
          <option value="Pending Repair">Pending Repair</option>
          <option value="Beyond Economic Repair">Beyond Economic Repair</option>
        </select>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
          data-testid="type-filter"
        >
          <option value="">All Types</option>
          {uniqueTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>

      {/* Items Table */}
      <div className="border border-zinc-800 bg-zinc-950/50 rounded-none overflow-hidden">
        {loading ? (
          <div className="text-center text-muted-foreground font-mono py-12">Loading inventory...</div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground font-mono py-12" data-testid="no-items-found">
            No items found. Click "Add Item" to create your first entry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm font-mono" data-testid="inventory-table">
              <thead>
                <tr className="border-b-2 border-zinc-700 bg-zinc-900/50">
                  <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Serial #</th>
                  <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Type</th>
                  <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Issuer</th>
                  <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Issued To</th>
                  <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Location</th>
                  <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                  <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors"
                    data-testid={`inventory-item-row-${item.serial_number}`}
                  >
                    <td className="p-3 font-bold text-olive-500">{item.serial_number}</td>
                    <td className="p-3">{item.item_type}</td>
                    <td className="p-3">{item.issuer_name}</td>
                    <td className="p-3">{item.issued_to_name}</td>
                    <td className="p-3">{item.location}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-none text-xs uppercase border ${statusColors[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSearchParams({ view: item.serial_number })}
                          className="p-1 text-blue-400 hover:bg-blue-500/10 transition-colors"
                          title="View"
                          data-testid={`view-item-${item.serial_number}`}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSearchParams({ edit: item.serial_number })}
                          className="p-1 text-yellow-400 hover:bg-yellow-500/10 transition-colors"
                          title="Edit"
                          data-testid={`edit-item-${item.serial_number}`}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.serial_number, item.id)}
                          className="p-1 text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                          data-testid={`delete-item-${item.serial_number}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {(action === 'add' || editSerial) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border-2 border-olive-500 rounded-none max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-zinc-800 bg-zinc-900/50 p-4 flex justify-between items-center sticky top-0">
              <h3 className="text-lg font-heading uppercase tracking-tight font-bold">
                {editSerial ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button
                onClick={() => setSearchParams({})}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="close-form-button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ItemForm
                serialNumber={editSerial}
                onSuccess={() => setSearchParams({})}
                onCancel={() => setSearchParams({})}
              />
            </div>
          </div>
        </div>
      )}

      {viewSerial && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border-2 border-olive-500 rounded-none max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="border-b-2 border-zinc-800 bg-zinc-900/50 p-4 flex justify-between items-center sticky top-0">
              <h3 className="text-lg font-heading uppercase tracking-tight font-bold">
                Item Details
              </h3>
              <button
                onClick={() => setSearchParams({})}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="close-detail-button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ItemDetail serialNumber={viewSerial} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;