import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInventory } from '../contexts/InventoryContext';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const itemSchema = z.object({
  serial_number: z.string().min(1, 'Serial number is required'),
  item_type: z.string().min(1, 'Item type is required'),
  issuer_name: z.string().min(1, 'Issuer name is required'),
  issued_to_name: z.string().min(1, 'Issued to name is required'),
  location: z.string().min(1, 'Location is required'),
  status: z.enum(['Serviceable', 'Pending Repair', 'Beyond Economic Repair'], {
    errorMap: () => ({ message: 'Please select a valid status' }),
  }),
});

const ItemForm = ({ serialNumber, onSuccess, onCancel }) => {
  const { createItem, updateItem, items, isOnline } = useInventory();
  const [loading, setLoading] = useState(false);
  const isEdit = !!serialNumber;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(itemSchema),
  });

  useEffect(() => {
    if (isEdit && serialNumber) {
      // Fetch item data
      const fetchItem = async () => {
        try {
          let item;
          if (isOnline) {
            const response = await axios.get(`${API}/items/${serialNumber}`);
            item = response.data;
          } else {
            item = items.find(i => i.serial_number === serialNumber);
          }
          if (item) {
            reset({
              serial_number: item.serial_number,
              item_type: item.item_type,
              issuer_name: item.issuer_name,
              issued_to_name: item.issued_to_name,
              location: item.location,
              status: item.status,
            });
          }
        } catch (error) {
          toast.error('Failed to load item data');
        }
      };
      fetchItem();
    }
  }, [serialNumber, isEdit, reset, isOnline, items]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (isEdit) {
        const { serial_number, ...updateData } = data;
        await updateItem(serialNumber, updateData);
        toast.success('Item updated successfully');
      } else {
        await createItem(data);
        toast.success('Item created successfully');
      }
      onSuccess();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Operation failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" data-testid="item-form">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Serial Number */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Serial Number *
          </label>
          <input
            {...register('serial_number')}
            disabled={isEdit}
            className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono disabled:opacity-50"
            data-testid="serial-number-input"
          />
          {errors.serial_number && (
            <p className="text-xs text-red-400 mt-1">{errors.serial_number.message}</p>
          )}
        </div>

        {/* Item Type */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Item Type *
          </label>
          <input
            {...register('item_type')}
            className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
            placeholder="e.g., Rifle, Radio, Tent"
            data-testid="item-type-input"
          />
          {errors.item_type && (
            <p className="text-xs text-red-400 mt-1">{errors.item_type.message}</p>
          )}
        </div>

        {/* Issuer Name */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Issuer Name *
          </label>
          <input
            {...register('issuer_name')}
            className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
            placeholder="Name of person issuing"
            data-testid="issuer-name-input"
          />
          {errors.issuer_name && (
            <p className="text-xs text-red-400 mt-1">{errors.issuer_name.message}</p>
          )}
        </div>

        {/* Issued To Name */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Issued To *
          </label>
          <input
            {...register('issued_to_name')}
            className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
            placeholder="Name of person receiving"
            data-testid="issued-to-input"
          />
          {errors.issued_to_name && (
            <p className="text-xs text-red-400 mt-1">{errors.issued_to_name.message}</p>
          )}
        </div>

        {/* Location */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Location *
          </label>
          <input
            {...register('location')}
            className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
            placeholder="Storage location"
            data-testid="location-input"
          />
          {errors.location && (
            <p className="text-xs text-red-400 mt-1">{errors.location.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Status *
          </label>
          <select
            {...register('status')}
            className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
            data-testid="status-select"
          >
            <option value="">Select status</option>
            <option value="Serviceable">Serviceable</option>
            <option value="Pending Repair">Pending Repair</option>
            <option value="Beyond Economic Repair">Beyond Economic Repair</option>
          </select>
          {errors.status && (
            <p className="text-xs text-red-400 mt-1">{errors.status.message}</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-zinc-800">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-olive-500 bg-olive-500 text-white hover:bg-olive-600 transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="submit-button"
        >
          {loading ? 'Processing...' : isEdit ? 'Update Item' : 'Create Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-zinc-700 text-muted-foreground hover:bg-zinc-900 transition-colors duration-100"
          data-testid="cancel-button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ItemForm;