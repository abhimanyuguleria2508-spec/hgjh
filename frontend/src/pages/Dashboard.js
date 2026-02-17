import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Box, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { items, stats, fetchItems, fetchStats, loading } = useInventory();

  useEffect(() => {
    fetchStats();
  }, [items]);

  const statCards = [
    {
      label: 'Total Items',
      value: stats.total_items,
      icon: Box,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-l-blue-500',
    },
    {
      label: 'Serviceable',
      value: stats.serviceable,
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-l-green-500',
    },
    {
      label: 'Pending Repair',
      value: stats.pending_repair,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-l-yellow-500',
    },
    {
      label: 'Beyond Economic Repair',
      value: stats.beyond_repair,
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-l-red-500',
    },
  ];

  const recentItems = items.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-heading font-bold uppercase tracking-tight" data-testid="dashboard-title">
            Command Center
          </h2>
          <p className="text-sm font-mono text-muted-foreground mt-1 uppercase tracking-wider">
            Real-time inventory overview
          </p>
        </div>
        <button
          onClick={() => navigate('/inventory?action=add')}
          className="flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-olive-500 bg-olive-500 text-white hover:bg-olive-600 transition-colors duration-100"
          data-testid="add-item-button"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`rounded-none border border-zinc-800 ${stat.bgColor} p-4 border-l-4 ${stat.borderColor}`}
              data-testid={`stat-card-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-3xl font-mono font-bold ${stat.color}`}>
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Items */}
      <div className="border border-zinc-800 bg-zinc-950/50 rounded-none">
        <div className="border-b-2 border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-lg font-heading uppercase tracking-tight font-bold" data-testid="recent-items-title">
            Recent Items
          </h3>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center text-muted-foreground font-mono py-8">Loading...</div>
          ) : recentItems.length === 0 ? (
            <div className="text-center text-muted-foreground font-mono py-8" data-testid="no-items-message">
              No items found. Add your first item to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm font-mono" data-testid="recent-items-table">
                <thead>
                  <tr className="border-b-2 border-zinc-700 bg-zinc-900/50">
                    <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Serial #</th>
                    <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Type</th>
                    <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Location</th>
                    <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 uppercase tracking-wider text-muted-foreground font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {recentItems.map((item) => {
                    const statusColors = {
                      'Serviceable': 'text-green-400 bg-green-500/10',
                      'Pending Repair': 'text-yellow-400 bg-yellow-500/10',
                      'Beyond Economic Repair': 'text-red-400 bg-red-500/10',
                    };
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors cursor-pointer"
                        onClick={() => navigate(`/inventory?view=${item.serial_number}`)}
                        data-testid={`recent-item-row-${item.serial_number}`}
                      >
                        <td className="p-3">{item.serial_number}</td>
                        <td className="p-3">{item.item_type}</td>
                        <td className="p-3">{item.location}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-none text-xs uppercase ${statusColors[item.status]}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {format(new Date(item.created_at), 'dd MMM yyyy HH:mm')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;