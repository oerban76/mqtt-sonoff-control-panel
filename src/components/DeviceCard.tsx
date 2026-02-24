import { Power, Settings, Trash2, RefreshCw, Sliders } from 'lucide-react';
import { Device, DeviceInfo } from '../types';
import { cn } from '../utils/cn';

interface DeviceCardProps {
  device: Device;
  status: DeviceInfo | undefined;
  onToggle: () => void;
  onCommand: (command: string, payload?: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onOpenConfig: () => void;
  isConnected: boolean;
}

export function DeviceCard({ device, status, onToggle, onCommand, onDelete, onEdit, onOpenConfig, isConnected }: DeviceCardProps) {
  const isOn = status?.status === 'ON';
  const isOnline = status?.isOnline ?? false;

  return (
    <div className={cn(
      "relative bg-white rounded-2xl shadow-lg border transition-all duration-300 overflow-hidden",
      isOn ? "border-emerald-200 shadow-emerald-100" : "border-gray-100",
      !isConnected && "opacity-60"
    )}>
      {/* Status indicator */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        isOnline ? (isOn ? "bg-emerald-500" : "bg-gray-300") : "bg-red-400"
      )} />
      
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-lg truncate">{device.name}</h3>
            <p className="text-sm text-gray-500 font-mono truncate">{device.topic}</p>
            {/* IP Address Display */}
            {status?.ipAddress && (
              <div className="mt-1 inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-mono font-medium">{status.ipAddress}</span>
              </div>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Device"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete Device"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status & Info Row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
            isOnline 
              ? (isOn ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600")
              : "bg-red-100 text-red-600"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              isOnline ? (isOn ? "bg-emerald-500 animate-pulse" : "bg-gray-400") : "bg-red-500"
            )} />
            {isOnline ? (isOn ? 'ON' : 'OFF') : 'Offline'}
          </div>
          
          {status?.rssi && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
              <span className="text-xs text-gray-500">WiFi:</span>
              <span className={cn(
                "text-xs font-medium",
                status.rssi > 70 ? "text-emerald-600" : status.rssi > 40 ? "text-amber-600" : "text-red-600"
              )}>
                {status.rssi}%
              </span>
            </div>
          )}
          
          {status?.lastSeen && (
            <span className="text-xs text-gray-400">
              {status.lastSeen}
            </span>
          )}
        </div>

        {/* Sensor Data (if available) */}
        {(status?.temperature !== undefined || status?.power !== undefined) && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {status?.temperature !== undefined && (
                <div>
                  <span className="text-gray-500">Temp:</span>
                  <span className="ml-1 font-medium text-gray-700">{status.temperature}°C</span>
                </div>
              )}
              {status?.humidity !== undefined && (
                <div>
                  <span className="text-gray-500">Humidity:</span>
                  <span className="ml-1 font-medium text-gray-700">{status.humidity}%</span>
                </div>
              )}
              {status?.power !== undefined && (
                <div>
                  <span className="text-gray-500">Power:</span>
                  <span className="ml-1 font-medium text-gray-700">{status.power}W</span>
                </div>
              )}
              {status?.voltage !== undefined && (
                <div>
                  <span className="text-gray-500">Voltage:</span>
                  <span className="ml-1 font-medium text-gray-700">{status.voltage}V</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Power Button */}
        <button
          onClick={onToggle}
          disabled={!isConnected}
          className={cn(
            "w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300",
            isOn 
              ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300" 
              : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-600 hover:from-gray-200 hover:to-gray-300",
            !isConnected && "cursor-not-allowed opacity-50"
          )}
        >
          <Power className={cn("w-6 h-6", isOn && "drop-shadow-lg")} />
          {isOn ? 'Turn OFF' : 'Turn ON'}
        </button>

        {/* Quick Actions */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => onCommand('STATUS', '')}
            disabled={!isConnected}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Status
          </button>
          <button
            onClick={onOpenConfig}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-colors text-sm font-medium shadow-md"
          >
            <Sliders className="w-4 h-4" />
            Config
          </button>
        </div>
      </div>
    </div>
  );
}
