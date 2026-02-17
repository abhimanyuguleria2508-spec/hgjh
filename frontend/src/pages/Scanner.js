import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { Camera, AlertCircle, CheckCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useInventory } from '../contexts/InventoryContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Scanner = () => {
  const navigate = useNavigate();
  const { items, isOnline } = useInventory();
  const [scanning, setScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [manualSerial, setManualSerial] = useState('');
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    if (scanning && !scanner) {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        'qr-reader',
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanFailure);
      setScanner(html5QrcodeScanner);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanning]);

  const onScanSuccess = async (decodedText) => {
    console.log('QR Code scanned:', decodedText);
    toast.success('QR Code scanned successfully');
    await lookupItem(decodedText);
    
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    setScanning(false);
  };

  const onScanFailure = (error) => {
    // Silent fail - this is called frequently during scanning
  };

  const lookupItem = async (serialNumber) => {
    try {
      let item;
      if (isOnline) {
        const response = await axios.get(`${API}/items/${serialNumber}`);
        item = response.data;
      } else {
        item = items.find(i => i.serial_number === serialNumber);
      }

      if (item) {
        setScannedData(item);
        toast.success('Item found!');
      } else {
        toast.error('Item not found in inventory');
        setScannedData(null);
      }
    } catch (error) {
      console.error('Error looking up item:', error);
      toast.error('Item not found in inventory');
      setScannedData(null);
    }
  };

  const handleManualLookup = () => {
    if (!manualSerial.trim()) {
      toast.error('Please enter a serial number');
      return;
    }
    lookupItem(manualSerial.trim());
  };

  const startScanning = () => {
    setScanning(true);
    setScannedData(null);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear().catch(console.error);
      setScanner(null);
    }
    setScanning(false);
  };

  const statusColors = {
    'Serviceable': 'text-green-400 bg-green-500/10 border-green-500',
    'Pending Repair': 'text-yellow-400 bg-yellow-500/10 border-yellow-500',
    'Beyond Economic Repair': 'text-red-400 bg-red-500/10 border-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-heading font-bold uppercase tracking-tight" data-testid="scanner-title">
          QR Code Scanner
        </h2>
        <p className="text-sm font-mono text-muted-foreground mt-1 uppercase tracking-wider">
          Scan or enter serial number to view item details
        </p>
      </div>

      {/* Scanner Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Scanner */}
        <div className="border border-zinc-800 bg-zinc-950/50 rounded-none p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading uppercase tracking-tight font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-olive-500" />
              Camera Scanner
            </h3>
          </div>

          {!scanning ? (
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground font-mono mb-4">Click below to start scanning QR codes</p>
              <button
                onClick={startScanning}
                className="px-6 py-3 rounded-none font-mono uppercase tracking-widest border-2 border-olive-500 bg-olive-500 text-white hover:bg-olive-600 transition-colors duration-100"
                data-testid="start-scan-button"
              >
                Start Camera
              </button>
            </div>
          ) : (
            <div>
              <div id="qr-reader" className="rounded-none overflow-hidden border-2 border-olive-500" data-testid="qr-reader"></div>
              <button
                onClick={stopScanning}
                className="mt-4 w-full px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-100"
                data-testid="stop-scan-button"
              >
                Stop Scanner
              </button>
            </div>
          )}
        </div>

        {/* Manual Entry */}
        <div className="border border-zinc-800 bg-zinc-950/50 rounded-none p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-heading uppercase tracking-tight font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-olive-500" />
              Manual Lookup
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
                Enter Serial Number
              </label>
              <input
                type="text"
                value={manualSerial}
                onChange={(e) => setManualSerial(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
                placeholder="Type serial number..."
                data-testid="manual-serial-input"
              />
            </div>
            <button
              onClick={handleManualLookup}
              className="w-full px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-olive-500 bg-olive-500/10 text-olive-500 hover:bg-olive-500 hover:text-white transition-colors duration-100"
              data-testid="manual-lookup-button"
            >
              Lookup Item
            </button>
          </div>

          <div className="mt-8 p-4 border border-zinc-700 bg-zinc-900/30 rounded-none">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono text-muted-foreground">
                  <span className="text-yellow-400 font-bold">TIP:</span> You can also scan QR codes from saved images by uploading them through the camera scanner interface.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scanned Item Result */}
      {scannedData && (
        <div className="border-2 border-olive-500 bg-zinc-950/50 rounded-none p-6 animate-in fade-in duration-300" data-testid="scanned-item-result">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h3 className="text-xl font-heading uppercase tracking-tight font-bold text-green-400">
              Item Located
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 border border-zinc-800 bg-zinc-900/30 rounded-none">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">Serial Number</span>
              <p className="font-mono font-bold text-olive-500">{scannedData.serial_number}</p>
            </div>

            <div className="p-3 border border-zinc-800 bg-zinc-900/30 rounded-none">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">Item Type</span>
              <p className="font-mono">{scannedData.item_type}</p>
            </div>

            <div className="p-3 border border-zinc-800 bg-zinc-900/30 rounded-none">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">Status</span>
              <span className={`inline-block px-2 py-1 rounded-none text-xs uppercase border font-mono ${statusColors[scannedData.status]}`}>
                {scannedData.status}
              </span>
            </div>

            <div className="p-3 border border-zinc-800 bg-zinc-900/30 rounded-none">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">Issuer</span>
              <p className="font-mono">{scannedData.issuer_name}</p>
            </div>

            <div className="p-3 border border-zinc-800 bg-zinc-900/30 rounded-none">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">Issued To</span>
              <p className="font-mono">{scannedData.issued_to_name}</p>
            </div>

            <div className="p-3 border border-zinc-800 bg-zinc-900/30 rounded-none">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">Location</span>
              <p className="font-mono">{scannedData.location}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate(`/inventory?view=${scannedData.serial_number}`)}
              className="flex-1 px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-olive-500 bg-olive-500 text-white hover:bg-olive-600 transition-colors duration-100"
              data-testid="view-full-details-button"
            >
              View Full Details
            </button>
            <button
              onClick={() => navigate(`/inventory?edit=${scannedData.serial_number}`)}
              className="px-4 py-2 rounded-none font-mono uppercase tracking-widest border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors duration-100"
              data-testid="edit-item-button"
            >
              Edit Item
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scanner;