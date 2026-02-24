import { useState, useEffect } from 'react';
import { X, Plus, Cpu } from 'lucide-react';
import { Device } from '../types';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (device: Omit<Device, 'id' | 'status' | 'isOnline'>) => void;
  editDevice?: Device | null;
}

export function AddDeviceModal({ isOpen, onClose, onSave, editDevice }: AddDeviceModalProps) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    if (editDevice) {
      setName(editDevice.name);
      setTopic(editDevice.topic);
    } else {
      setName('');
      setTopic('');
    }
  }, [editDevice, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && topic) {
      onSave({ name, topic });
      setName('');
      setTopic('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            {editDevice ? 'Edit Device' : 'Add New Device'}
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Device Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
              placeholder="Living Room Light"
              required
            />
          </div>

          {/* MQTT Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              MQTT Topic (Device Name in Tasmota)
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
              placeholder="sonoff-dapur"
              required
            />
            <p className="mt-2 text-sm text-gray-500">
              Command: <code className="bg-gray-100 px-2 py-0.5 rounded">cmnd/{topic || 'topic'}/POWER</code>
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Status: <code className="bg-gray-100 px-2 py-0.5 rounded">stat/{topic || 'topic'}/POWER</code>
            </p>
          </div>

          {/* Preset Examples */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Templates
            </label>
            <div className="flex flex-wrap gap-2">
              {['sonoff-dapur', 'sonoff-kamar', 'sonoff-teras', 'tasmota'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTopic(preset)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-600 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {editDevice ? 'Update Device' : 'Add Device'}
          </button>
        </form>
      </div>
    </div>
  );
}
