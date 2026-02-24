import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, AlertCircle } from 'lucide-react';
import { Header } from './components/Header';
import { DeviceCard } from './components/DeviceCard';
import { SettingsModal } from './components/SettingsModal';
import { AddDeviceModal } from './components/AddDeviceModal';
import { TasmotaConfigModal } from './components/TasmotaConfigModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useMqtt } from './hooks/useMqtt';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Device, MqttSettings } from './types';

const DEFAULT_SETTINGS: MqttSettings = {
  brokerUrl: 'f56a4a2eb43d41c78add8e851e256d5c.s1.eu.hivemq.cloud',
  port: 8883,
  username: 'urangbandung',
  password: 'B@ndung1975',
  useSSL: true,
};

const DEFAULT_DEVICES: Device[] = [
  {
    id: '1',
    name: 'Lampu Dapur',
    topic: 'sonoff-dapur',
    status: 'UNKNOWN',
    isOnline: false,
  },
  {
    id: '2',
    name: 'Lampu Kamar',
    topic: 'sonoff-kamar',
    status: 'UNKNOWN',
    isOnline: false,
  },
];

export function App() {
  const [settings, setSettings] = useLocalStorage<MqttSettings>('mqtt-settings', DEFAULT_SETTINGS);
  const [devices, setDevices] = useLocalStorage<Device[]>('mqtt-devices', DEFAULT_DEVICES);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [configDevice, setConfigDevice] = useState<Device | null>(null);

  const {
    isConnected,
    connectionStatus,
    errorMessage,
    connect,
    disconnect,
    sendCommand,
    sendRawCommand,
    subscribeToDevice,
    deviceStatuses,
    lastMessage,
  } = useMqtt();

  // Auto-connect on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      connect(settings);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Subscribe to devices when connected
  useEffect(() => {
    if (isConnected) {
      devices.forEach(device => {
        subscribeToDevice(device.topic);
      });
    }
  }, [isConnected, devices, subscribeToDevice]);

  const handleConnect = useCallback(() => {
    connect(settings);
  }, [connect, settings]);

  const handleToggle = useCallback((device: Device) => {
    const currentStatus = deviceStatuses[device.topic]?.status;
    const newState = currentStatus === 'ON' ? 'OFF' : 'ON';
    sendCommand(device, 'POWER', newState);
  }, [sendCommand, deviceStatuses]);

  const handleCommand = useCallback((device: Device, command: string, payload?: string) => {
    sendCommand(device, command, payload);
  }, [sendCommand]);

  const handleConfigCommand = useCallback((topic: string, command: string, payload?: string) => {
    sendRawCommand(topic, command, payload);
  }, [sendRawCommand]);

  const handleAddDevice = useCallback((deviceData: Omit<Device, 'id' | 'status' | 'isOnline'>) => {
    if (editingDevice) {
      setDevices(prev => prev.map(d => 
        d.id === editingDevice.id 
          ? { ...d, name: deviceData.name, topic: deviceData.topic }
          : d
      ));
      setEditingDevice(null);
    } else {
      const newDevice: Device = {
        id: Date.now().toString(),
        ...deviceData,
        status: 'UNKNOWN',
        isOnline: false,
      };
      setDevices(prev => [...prev, newDevice]);
      if (isConnected) {
        subscribeToDevice(newDevice.topic);
      }
    }
  }, [editingDevice, setDevices, isConnected, subscribeToDevice]);

  const handleDeleteDevice = useCallback((deviceId: string) => {
    if (window.confirm('Are you sure you want to delete this device?')) {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    }
  }, [setDevices]);

  const handleEditDevice = useCallback((device: Device) => {
    setEditingDevice(device);
    setShowAddDevice(true);
  }, []);

  const handleSettingsSave = useCallback((newSettings: MqttSettings) => {
    setSettings(newSettings);
  }, [setSettings]);

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header
        isConnected={isConnected}
        connectionStatus={connectionStatus}
        onSettingsClick={() => setShowSettings(true)}
        onAddDeviceClick={() => {
          setEditingDevice(null);
          setShowAddDevice(true);
        }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Connection Info */}
        {!isConnected && connectionStatus !== 'connecting' && (
          <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-800">Not Connected</h3>
                <p className="text-amber-700 text-sm mt-1">
                  You are not connected to the MQTT broker. Click the button below or go to settings to connect.
                </p>
                <button
                  onClick={handleConnect}
                  className="mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                >
                  Connect Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Device Grid */}
        {devices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {devices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                status={deviceStatuses[device.topic]}
                onToggle={() => handleToggle(device)}
                onCommand={(cmd, payload) => handleCommand(device, cmd, payload)}
                onDelete={() => handleDeleteDevice(device.id)}
                onEdit={() => handleEditDevice(device)}
                onOpenConfig={() => setConfigDevice(device)}
                isConnected={isConnected}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lightbulb className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Devices Yet</h3>
            <p className="text-gray-500 mb-6">Add your first Sonoff Tasmota device to get started</p>
            <button
              onClick={() => setShowAddDevice(true)}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow"
            >
              Add First Device
            </button>
          </div>
        )}

        {/* Quick Stats */}
        {devices.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Total Devices</p>
              <p className="text-2xl font-bold text-gray-800">{devices.length}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Online</p>
              <p className="text-2xl font-bold text-emerald-600">
                {Object.values(deviceStatuses).filter(s => s.isOnline).length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Turned On</p>
              <p className="text-2xl font-bold text-amber-600">
                {Object.values(deviceStatuses).filter(s => s.status === 'ON').length}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Connection</p>
              <p className={`text-lg font-bold capitalize ${isConnected ? 'text-emerald-600' : 'text-red-500'}`}>
                {connectionStatus}
              </p>
            </div>
          </div>
        )}

        {/* MQTT Info - Hidden from main view, accessible in Settings */}

        {/* Tasmota Commands Reference - Hidden from main view */}
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSettingsSave}
        connectionStatus={connectionStatus}
        onConnect={handleConnect}
        onDisconnect={disconnect}
        isConnected={isConnected}
      />

      <AddDeviceModal
        isOpen={showAddDevice}
        onClose={() => {
          setShowAddDevice(false);
          setEditingDevice(null);
        }}
        onSave={handleAddDevice}
        editDevice={editingDevice}
      />

      {configDevice && (
        <TasmotaConfigModal
          isOpen={true}
          onClose={() => setConfigDevice(null)}
          device={configDevice}
          deviceInfo={deviceStatuses[configDevice.topic]}
          onCommand={(cmd, payload) => handleConfigCommand(configDevice.topic, cmd, payload)}
          isConnected={isConnected}
          lastMessage={lastMessage}
        />
      )}
    </div>
    </ErrorBoundary>
  );
}
