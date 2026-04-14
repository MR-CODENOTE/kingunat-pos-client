import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import { Tag, UserCheck } from 'lucide-react';

const SettingsPage = () => {
  const { setCurrentRoute } = useAuth();
  const toast = useToast();
  const [discountPresets, setDiscountPresets] = useState([]);

  const fetchDiscountPresets = useCallback(async () => {
    try {
      const response = await api.get('/settings/discounts');
      setDiscountPresets(response.data);
    } catch (error) {
      toast.showToast('Failed to fetch discount presets.', 'error');
      console.error('Error fetching discount presets:', error);
    }
  }, [toast]);

  useEffect(() => {
    setCurrentRoute('System Settings');
    fetchDiscountPresets();
  }, [setCurrentRoute, fetchDiscountPresets]);

  const handlePresetChange = (index, field, value) => {
    const updatedPresets = [...discountPresets];
    updatedPresets[index] = { ...updatedPresets[index], [field]: value };
    setDiscountPresets(updatedPresets);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      for (const preset of discountPresets) {
        await api.put(`/settings/discounts/${preset.id}`, { type: preset.type, value: parseFloat(preset.value), label: preset.label });
      }
      toast.showToast('Discount presets saved successfully!', 'success');
    } catch (error) {
      toast.showToast(error.response?.data?.message || 'Failed to save settings.', 'error');
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-xl border p-6 max-w-lg">
        <h3 className="font-bold text-lg mb-4">Discount Presets</h3>
        <form onSubmit={saveSettings} className="space-y-4">
          {discountPresets.length > 0 && (
            <>
              <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2"><Tag className="w-4 h-4" /> Quick Button 1</h4>
              <div className="grid grid-cols-2 gap-2">
                <input id="p1-l" className="border p-2 rounded" value={discountPresets[0].label} onChange={(e) => handlePresetChange(0, 'label', e.target.value)} />
                <input id="p1-v" type="number" className="border p-2 rounded" value={discountPresets[0].value} onChange={(e) => handlePresetChange(0, 'value', e.target.value)} />
              </div>
            </>
          )}
          {discountPresets.length > 1 && (
            <>
              <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2 mt-4"><UserCheck className="w-4 h-4" /> Quick Button 2</h4>
              <div className="grid grid-cols-2 gap-2">
                <input id="p2-l" className="border p-2 rounded" value={discountPresets[1].label} onChange={(e) => handlePresetChange(1, 'label', e.target.value)} />
                <input id="p2-v" type="number" className="border p-2 rounded" value={discountPresets[1].value} onChange={(e) => handlePresetChange(1, 'value', e.target.value)} />
              </div>
            </>
          )}
          <button type="submit" className="bg-japan-red text-white px-4 py-2 rounded mt-2 hover:bg-red-800">Save</button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
