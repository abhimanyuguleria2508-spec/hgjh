import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useInventory } from '../contexts/InventoryContext';
import { format } from 'date-fns';
import { Download, Calendar, User, MapPin, Package, Shield } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ItemDetail = ({ serialNumber }) => {
  const { items, isOnline } = useInventory();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        if (isOnline) {
          const response = await axios.get(`${API}/items/${serialNumber}`);
          setItem(response.data);
        } else {
          const localItem = items.find(i => i.serial_number === serialNumber);
          setItem(localItem);
        }
      } catch (error) {
        console.error('Error fetching item:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [serialNumber, isOnline, items]);

  const downloadQR = () => {
    const svg = document.getElementById('qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${serialNumber}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return <div className="text-center text-muted-foreground font-mono py-8">Loading...</div>;
  }

  if (!item) {
    return <div className="text-center text-red-400 font-mono py-8">Item not found</div>;
  }

  const statusColors = {
    'Serviceable': 'text-green-400 bg-green-500/10 border-green-500',
    'Pending Repair': 'text-yellow-400 bg-yellow-500/10 border-yellow-500',
    'Beyond Economic Repair': 'text-red-400 bg-red-500/10 border-red-500',
  };

  return (
    <div className="space-y-6" data-testid="item-detail-view">
      {/* QR Code Section */}
      <div className="flex flex-col items-center justify-center p-6 border border-zinc-800 bg-zinc-900/50 rounded-none">
        <QRCodeSVG
          id="qr-code"
          value={item.serial_number}
          size={200}
          bgColor="#0a0a0a"
          fgColor="#4B5320"
          level="H"
          data-testid="qr-code-display"
        />
        <p className="mt-4 font-mono text-sm text-muted-foreground uppercase tracking-wider">Serial: {item.serial_number}</p>
        <button
          onClick={downloadQR}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-olive-500 bg-olive-500/10 text-olive-500 hover:bg-olive-500 hover:text-white transition-colors duration-100"
          data-testid="download-qr-button"
        >
          <Download className="w-4 h-4" />
          Download QR Code
        </button>
      </div>

      {/* Item Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-none">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-olive-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Item Type</span>
          </div>
          <p className="font-mono text-lg" data-testid="detail-item-type">{item.item_type}</p>
        </div>

        <div className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-none">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-olive-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Status</span>
          </div>
          <span className={`inline-block px-3 py-1 rounded-none text-sm uppercase border font-mono ${statusColors[item.status]}`} data-testid="detail-status">
            {item.status}
          </span>
        </div>

        <div className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-none">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-olive-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Issuer</span>
          </div>
          <p className="font-mono" data-testid="detail-issuer">{item.issuer_name}</p>
        </div>

        <div className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-none">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-olive-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Issued To</span>
          </div>
          <p className="font-mono" data-testid="detail-issued-to">{item.issued_to_name}</p>
        </div>

        <div className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-none">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-olive-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Location</span>
          </div>
          <p className="font-mono" data-testid="detail-location">{item.location}</p>
        </div>

        <div className="p-4 border border-zinc-800 bg-zinc-900/30 rounded-none">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-olive-500" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Created</span>
          </div>
          <p className="font-mono text-sm" data-testid="detail-created">
            {format(new Date(item.created_at), 'dd MMM yyyy HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;