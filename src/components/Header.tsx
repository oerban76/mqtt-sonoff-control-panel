import { Settings, Wifi, WifiOff, Plus, Zap } from 'lucide-react';
import { cn } from '../utils/cn';

interface HeaderProps {
  isConnected: boolean;
  connectionStatus: string;
  onSettingsClick: () => void;
  onAddDeviceClick: () => void;
}

export function Header({ isConnected, connectionStatus, onSettingsClick, onAddDeviceClick }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold tracking-tight">Tasmota Controller</h1>
              <p className="text-xs text-slate-400 hidden sm:block">Smart Home MQTT Control Panel</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Connection Status */}
            <div className={cn(
              "hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
              isConnected 
                ? "bg-emerald-500/20 text-emerald-400" 
                : connectionStatus === 'connecting'
                ? "bg-amber-500/20 text-amber-400"
                : "bg-red-500/20 text-red-400"
            )}>
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="capitalize">{connectionStatus}</span>
            </div>

            {/* Mobile Connection Indicator */}
            <div className={cn(
              "sm:hidden w-3 h-3 rounded-full",
              isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
            )} />

            {/* Add Device Button */}
            <button
              onClick={onAddDeviceClick}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Device</span>
            </button>

            {/* Settings Button */}
            <button
              onClick={onSettingsClick}
              className="p-2 md:p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
