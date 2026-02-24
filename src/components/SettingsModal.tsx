import { useState, useEffect } from 'react';
import { X, Server, Lock, Wifi } from 'lucide-react';
import { MqttSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: MqttSettings;
  onSave: (settings: MqttSettings) => void;
  connectionStatus: string;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  connectionStatus,
  onConnect,
  onDisconnect,
  isConnected
}: SettingsModalProps) {
  const [formData, setFormData] = useState<MqttSettings>(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Server className="w-5 h-5" />
            MQTT Settings
          </h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Connection Status */}
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            isConnected ? 'bg-emerald-50 text-emerald-700' :
            connectionStatus === 'connecting' ? 'bg-amber-50 text-amber-700' :
            connectionStatus === 'error' ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-600'
          }`}>
            <Wifi className="w-5 h-5" />
            <span className="font-medium capitalize">{connectionStatus}</span>
          </div>

          {/* Broker URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Broker URL
            </label>
            <input
              type="text"
              value={formData.brokerUrl}
              onChange={(e) => setFormData({ ...formData, brokerUrl: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="broker.example.com"
            />
          </div>

          {/* Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Port
            </label>
            <input
              type="number"
              value={formData.port}
              onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 8883 })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="8883"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* SSL Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-700">Use SSL/TLS</span>
            <button
              onClick={() => setFormData({ ...formData, useSSL: !formData.useSSL })}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                formData.useSSL ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  formData.useSSL ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
          >
            Save Settings
          </button>
          {isConnected ? (
            <button
              onClick={onDisconnect}
              className="flex-1 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={() => {
                handleSave();
                onConnect();
              }}
              className="flex-1 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
