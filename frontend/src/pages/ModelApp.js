import React, { useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

const initialValues = {
  serial_number: '',
  issuer_name: '',
  issued_to_name: '',
  item_type: '',
  location: '',
  status: 'Serviceable',
};

const requiredFields = [
  'serial_number',
  'issuer_name',
  'issued_to_name',
  'item_type',
  'location',
  'status',
];

const ModelApp = () => {
  const [formData, setFormData] = useState(initialValues);

  const missingFields = useMemo(
    () => requiredFields.filter((field) => !String(formData[field] || '').trim()),
    [formData]
  );

  const isValid = missingFields.length === 0;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const payload = JSON.stringify(formData, null, 2);

  return (
    <div className="space-y-6" data-testid="model-app-page">
      <div>
        <h2 className="text-3xl font-heading font-bold uppercase tracking-tight">Inventory Item Model App</h2>
        <p className="text-sm font-mono text-muted-foreground mt-1 uppercase tracking-wider">
          Build and validate payloads from the repository&apos;s InventoryItemCreate model
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="border border-zinc-800 bg-zinc-950/50 rounded-none p-6 space-y-4">
          <h3 className="text-lg font-heading uppercase tracking-tight font-bold">Model Fields</h3>

          {requiredFields.map((fieldName) => (
            <div key={fieldName} className="space-y-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-muted-foreground">
                {fieldName.replaceAll('_', ' ')}
              </label>

              {fieldName === 'status' ? (
                <select
                  name={fieldName}
                  value={formData[fieldName]}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
                >
                  <option value="Serviceable">Serviceable</option>
                  <option value="Pending Repair">Pending Repair</option>
                  <option value="Beyond Economic Repair">Beyond Economic Repair</option>
                </select>
              ) : (
                <input
                  type="text"
                  name={fieldName}
                  value={formData[fieldName]}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-none border-b-2 border-zinc-700 bg-zinc-900 text-sm focus:border-olive-500 focus:outline-none focus:ring-0 font-mono"
                  placeholder={`Enter ${fieldName}`}
                />
              )}
            </div>
          ))}
        </section>

        <section className="border border-zinc-800 bg-zinc-950/50 rounded-none p-6 space-y-4">
          <h3 className="text-lg font-heading uppercase tracking-tight font-bold">Generated Payload</h3>
          <pre className="bg-zinc-900 p-4 border border-zinc-800 text-xs overflow-x-auto font-mono">{payload}</pre>

          <div className={`p-3 border ${isValid ? 'border-green-500 bg-green-500/10' : 'border-yellow-500 bg-yellow-500/10'}`}>
            <div className="flex items-start gap-2">
              {isValid ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />
              )}
              <div className="font-mono text-xs">
                {isValid ? (
                  <p className="text-green-300">Payload is complete and ready for POST /api/items.</p>
                ) : (
                  <p className="text-yellow-300">Missing required fields: {missingFields.join(', ')}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Example Request</p>
            <pre className="bg-zinc-900 p-4 border border-zinc-800 text-xs overflow-x-auto font-mono">{`curl -X POST "$REACT_APP_BACKEND_URL/api/items" \\
  -H "Content-Type: application/json" \\
  -d '${payload.replaceAll("'", "\\'")}'`}</pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ModelApp;
