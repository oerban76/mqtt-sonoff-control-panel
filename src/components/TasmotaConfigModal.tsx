import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Cpu, Wifi, Settings, Info, RefreshCw, Terminal, 
  Zap, Timer, ToggleLeft, Sliders, FileCode, Download, 
  Power, Activity, ChevronRight, ArrowLeft, Send
} from 'lucide-react';
import { Device, DeviceInfo } from '../types';
import { cn } from '../utils/cn';

interface TasmotaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device;
  deviceInfo: DeviceInfo | undefined;
  onCommand: (command: string, payload?: string) => void;
  isConnected: boolean;
  lastMessage?: { topic: string; payload: string } | null;
}

type MenuPage = 'main' | 'configuration' | 'module' | 'wifi' | 'logging' | 'other' | 'template' | 
                'console' | 'information' | 'firmware' | 'timers' | 'gpio';

export function TasmotaConfigModal({ 
  isOpen, 
  onClose, 
  device, 
  deviceInfo,
  onCommand,
  isConnected,
  lastMessage
}: TasmotaConfigModalProps) {
  const [currentPage, setCurrentPage] = useState<MenuPage>('main');
  const [consoleInput, setConsoleInput] = useState('');
  const [consoleHistory, setConsoleHistory] = useState<string[]>([]);
  const [moduleSelect, setModuleSelect] = useState('');
  const [gpioConfig, setGpioConfig] = useState<Record<string, string>>({});
  const [timerInputs, setTimerInputs] = useState<Record<string, string>>({});
  const consoleRef = useRef<HTMLDivElement>(null);
  const initialLoadRef = useRef(false);

  // Memoized command sender to prevent multiple calls
  const sendCommand = useCallback((cmd: string, payload: string = '') => {
    onCommand(cmd, payload);
  }, [onCommand]);

  // Request device info only once when modal opens
  useEffect(() => {
    if (isOpen && !initialLoadRef.current && isConnected) {
      initialLoadRef.current = true;
      // Single STATUS 0 gets most info
      const timer = setTimeout(() => {
        sendCommand('STATUS', '0');
      }, 100);
      return () => clearTimeout(timer);
    }
    if (!isOpen) {
      initialLoadRef.current = false;
    }
  }, [isOpen, isConnected, sendCommand]);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPage('main');
      setConsoleHistory([]);
    }
  }, [isOpen]);

  // Update console history when new message arrives
  useEffect(() => {
    if (lastMessage && isOpen && currentPage === 'console') {
      // Only show messages for this device
      if (lastMessage.topic.includes(device.topic)) {
        const formattedMsg = `${lastMessage.topic}: ${lastMessage.payload}`;
        setConsoleHistory(prev => {
          // Prevent duplicate messages
          if (prev.length > 0 && prev[prev.length - 1] === formattedMsg) {
            return prev;
          }
          return [...prev.slice(-50), formattedMsg];
        });
        // Auto scroll to bottom
        setTimeout(() => {
          if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
          }
        }, 50);
      }
    }
  }, [lastMessage, isOpen, currentPage, device.topic]);

  if (!isOpen) return null;

  const handleConsoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (consoleInput.trim()) {
      const parts = consoleInput.trim().split(' ');
      const cmd = parts[0];
      const payload = parts.slice(1).join(' ');
      sendCommand(cmd, payload);
      setConsoleHistory(prev => [...prev, `> ${consoleInput}`]);
      setConsoleInput('');
    }
  };

  const handleQuickCommand = (cmd: string) => {
    const parts = cmd.split(' ');
    const command = parts[0];
    const payload = parts.slice(1).join(' ');
    sendCommand(command, payload);
    if (currentPage === 'console') {
      setConsoleHistory(prev => [...prev, `> ${cmd}`]);
    }
  };

  const renderMainMenu = () => (
    <div className="space-y-3">
      {/* Device Info Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">{device.name}</h3>
            <p className="text-blue-100 font-mono text-sm">{device.topic}</p>
          </div>
          <div className="text-right">
            {deviceInfo?.ipAddress && (
              <p className="font-mono text-sm bg-white/20 px-3 py-1 rounded-full">
                {deviceInfo.ipAddress}
              </p>
            )}
          </div>
        </div>
        {deviceInfo?.module && (
          <p className="text-blue-100 text-sm mt-2">Module: {deviceInfo.module}</p>
        )}
      </div>

      {/* Quick Status */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className={cn(
          "p-3 rounded-xl text-center",
          deviceInfo?.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        )}>
          <Activity className="w-5 h-5 mx-auto mb-1" />
          <p className="text-sm font-medium">{deviceInfo?.isOnline ? 'Online' : 'Offline'}</p>
        </div>
        <div className={cn(
          "p-3 rounded-xl text-center",
          deviceInfo?.status === 'ON' ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
        )}>
          <Power className="w-5 h-5 mx-auto mb-1" />
          <p className="text-sm font-medium">{deviceInfo?.status || 'Unknown'}</p>
        </div>
      </div>

      {/* Main Menu Items */}
      <MenuItem 
        icon={Settings} 
        label="Configuration" 
        onClick={() => setCurrentPage('configuration')}
      />
      <MenuItem 
        icon={Terminal} 
        label="Console" 
        onClick={() => setCurrentPage('console')}
      />
      <MenuItem 
        icon={Info} 
        label="Information" 
        onClick={() => setCurrentPage('information')}
      />
      <MenuItem 
        icon={Download} 
        label="Firmware Upgrade" 
        onClick={() => setCurrentPage('firmware')}
      />

      {/* Quick Actions */}
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold text-gray-500 mb-3">Quick Actions</h4>
        <div className="grid grid-cols-3 gap-2">
          <QuickButton 
            icon={Power} 
            label="Toggle" 
            onClick={() => sendCommand('POWER', 'TOGGLE')}
            color="emerald"
          />
          <QuickButton 
            icon={RefreshCw} 
            label="Restart" 
            onClick={() => sendCommand('RESTART', '1')}
            color="amber"
          />
          <QuickButton 
            icon={Activity} 
            label="Status" 
            onClick={() => sendCommand('STATUS', '0')}
            color="blue"
          />
        </div>
      </div>
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-3">
      <BackButton onClick={() => setCurrentPage('main')} />
      <h3 className="text-lg font-bold text-gray-800 mb-4">Configuration</h3>
      
      <MenuItem icon={Cpu} label="Configure Module" onClick={() => setCurrentPage('module')} />
      <MenuItem icon={Wifi} label="Configure WiFi" onClick={() => setCurrentPage('wifi')} />
      <MenuItem icon={FileCode} label="Configure Logging" onClick={() => setCurrentPage('logging')} />
      <MenuItem icon={Sliders} label="Configure Other" onClick={() => setCurrentPage('other')} />
      <MenuItem icon={Cpu} label="Configure Template" onClick={() => setCurrentPage('template')} />
      <MenuItem icon={ToggleLeft} label="Configure GPIO" onClick={() => setCurrentPage('gpio')} />
      <MenuItem icon={Timer} label="Configure Timers" onClick={() => setCurrentPage('timers')} />
    </div>
  );

  const renderModule = () => {
    const modules = [
      { id: 0, name: 'Generic' },
      { id: 1, name: 'Sonoff Basic' },
      { id: 2, name: 'Sonoff RF' },
      { id: 4, name: 'Sonoff TH' },
      { id: 5, name: 'Sonoff Dual' },
      { id: 6, name: 'Sonoff Pow' },
      { id: 7, name: 'Sonoff 4CH' },
      { id: 8, name: 'Sonoff S2X' },
      { id: 9, name: 'Sonoff Touch' },
      { id: 11, name: 'Sonoff LED' },
      { id: 18, name: 'Generic' },
      { id: 19, name: 'Sonoff Dev' },
      { id: 25, name: 'Sonoff Bridge' },
      { id: 26, name: 'Sonoff B1' },
      { id: 29, name: 'Sonoff T1 1CH' },
      { id: 30, name: 'Sonoff T1 2CH' },
      { id: 31, name: 'Sonoff T1 3CH' },
      { id: 41, name: 'Sonoff S31' },
      { id: 44, name: 'Sonoff iFan02' },
      { id: 71, name: 'Sonoff iFan03' },
    ];

    const gpioFunctions = [
      { id: 0, name: 'None' },
      { id: 1, name: 'Button' },
      { id: 21, name: 'Switch' },
      { id: 52, name: 'Relay' },
      { id: 56, name: 'LED' },
      { id: 17, name: 'DHT11' },
      { id: 18, name: 'DHT22' },
      { id: 32, name: 'PWM' },
    ];

    const gpioPins = [0, 1, 2, 3, 4, 5, 9, 10, 12, 13, 14, 15, 16];

    return (
      <div className="space-y-4">
        <BackButton onClick={() => setCurrentPage('configuration')} />
        <h3 className="text-lg font-bold text-gray-800">Module parameters</h3>
        
        <div className="bg-white border rounded-xl p-4 space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Module type</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={moduleSelect}
              onChange={(e) => setModuleSelect(e.target.value)}
            >
              <option value="">-- Select module --</option>
              {modules.map(m => (
                <option key={m.id} value={m.id}>{m.id} {m.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">GPIO Configuration</h4>
            <div className="space-y-2">
              {gpioPins.map(pin => (
                <div key={pin} className="flex items-center gap-2">
                  <label className="text-xs text-gray-600 w-16">GPIO{pin}</label>
                  <select
                    className="flex-1 px-2 py-1 border rounded text-xs"
                    value={gpioConfig[`gpio${pin}`] || '0'}
                    onChange={(e) => setGpioConfig(prev => ({ ...prev, [`gpio${pin}`]: e.target.value }))}
                  >
                    {gpioFunctions.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            if (moduleSelect) sendCommand('Module', moduleSelect);
            Object.keys(gpioConfig).forEach(key => {
              const pin = key.replace('gpio', '');
              sendCommand(`GPIO${pin}`, gpioConfig[key]);
            });
          }}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl"
        >
          Save
        </button>

        <div className="bg-amber-50 p-4 rounded-xl">
          <p className="text-sm text-amber-700">
            <strong>Warning:</strong> Device will restart after saving changes.
          </p>
        </div>
      </div>
    );
  };

  const renderWifi = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('configuration')} />
      <h3 className="text-lg font-bold text-gray-800">Configure WiFi</h3>
      
      <div className="bg-gray-50 p-4 rounded-xl space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-500">Current Network</label>
          <p className="text-gray-800 font-medium">{deviceInfo?.ssid || 'Click Get WiFi'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Signal Strength (RSSI)</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full",
                  (deviceInfo?.rssi ?? 0) > 70 ? "bg-emerald-500" : 
                  (deviceInfo?.rssi ?? 0) > 40 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${deviceInfo?.rssi || 0}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{deviceInfo?.rssi || 0}%</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">IP Address</label>
          <p className="text-gray-800 font-mono">{deviceInfo?.ipAddress || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Hostname</label>
          <p className="text-gray-800 font-mono">{deviceInfo?.hostname || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">MAC Address</label>
          <p className="text-gray-800 font-mono">{deviceInfo?.mac || '-'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <CommandButton label="Get WiFi Status" onClick={() => sendCommand('STATUS', '5')} />
      </div>
    </div>
  );

  const renderLogging = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('configuration')} />
      <h3 className="text-lg font-bold text-gray-800">Configure Logging</h3>
      
      <div className="space-y-2">
        <CommandButton label="Get Serial Log Level" onClick={() => sendCommand('SerialLog', '')} />
        <CommandButton label="Get Web Log Level" onClick={() => sendCommand('WebLog', '')} />
        <CommandButton label="Get MQTT Log Level" onClick={() => sendCommand('MqttLog', '')} />
        <CommandButton label="Get Syslog Level" onClick={() => sendCommand('SysLog', '')} />
      </div>

      <div className="bg-gray-50 p-4 rounded-xl">
        <h4 className="font-medium text-gray-700 mb-2">Log Levels</h4>
        <p className="text-sm text-gray-600">0 = None, 1 = Error, 2 = Info, 3 = Debug, 4 = More Debug</p>
      </div>
    </div>
  );

  const renderOther = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('configuration')} />
      <h3 className="text-lg font-bold text-gray-800">Configure Other</h3>
      
      <div className="space-y-3">
        <div className="bg-white border rounded-xl p-3">
          <label className="text-sm font-medium text-gray-700">Device Name</label>
          <div className="flex gap-2 mt-1">
            <input type="text" placeholder="Device Name" className="flex-1 px-3 py-2 border rounded-lg text-sm" id="deviceName" />
            <button onClick={() => {
              const val = (document.getElementById('deviceName') as HTMLInputElement)?.value;
              if (val) sendCommand('DeviceName', val);
            }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Set</button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-3">
          <label className="text-sm font-medium text-gray-700">Friendly Name</label>
          <div className="flex gap-2 mt-1">
            <input type="text" placeholder="Friendly Name" className="flex-1 px-3 py-2 border rounded-lg text-sm" id="friendlyName" />
            <button onClick={() => {
              const val = (document.getElementById('friendlyName') as HTMLInputElement)?.value;
              if (val) sendCommand('FriendlyName', val);
            }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Set</button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-3">
          <label className="text-sm font-medium text-gray-700">Emulation</label>
          <select className="w-full px-3 py-2 border rounded-lg text-sm mt-1" onChange={(e) => sendCommand('Emulation', e.target.value)}>
            <option value="">Select...</option>
            <option value="0">None</option>
            <option value="1">Belkin WeMo</option>
            <option value="2">Hue Bridge</option>
          </select>
        </div>

        <div className="bg-white border rounded-xl p-3">
          <label className="text-sm font-medium text-gray-700">Timezone</label>
          <div className="flex gap-2 mt-1">
            <input type="number" placeholder="-13 to +13" className="flex-1 px-3 py-2 border rounded-lg text-sm" id="timezone" />
            <button onClick={() => {
              const val = (document.getElementById('timezone') as HTMLInputElement)?.value;
              if (val) sendCommand('Timezone', val);
            }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Set</button>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-3">
          <label className="text-sm font-medium text-gray-700">NTP Server</label>
          <div className="flex gap-2 mt-1">
            <input type="text" placeholder="pool.ntp.org" className="flex-1 px-3 py-2 border rounded-lg text-sm" id="ntpServer" />
            <button onClick={() => {
              const val = (document.getElementById('ntpServer') as HTMLInputElement)?.value;
              if (val) sendCommand('NtpServer', val);
            }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">Set</button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <CommandButton label="Get All Settings" onClick={() => sendCommand('STATUS', '0')} />
      </div>
    </div>
  );

  const renderTemplate = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('configuration')} />
      <h3 className="text-lg font-bold text-gray-800">Configure Template</h3>
      
      <div className="bg-white border rounded-xl p-3">
        <label className="text-sm font-medium text-gray-700">Template JSON</label>
        <textarea
          placeholder='{"NAME":"...","GPIO":[...],"FLAG":0,"BASE":0}'
          className="w-full px-3 py-2 border rounded-lg text-xs font-mono mt-2"
          rows={6}
          id="templateJson"
        />
        <button
          onClick={() => {
            const val = (document.getElementById('templateJson') as HTMLTextAreaElement)?.value;
            if (val) sendCommand('Template', val);
          }}
          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Apply Template
        </button>
      </div>

      <div className="space-y-2">
        <CommandButton label="Get Current Template" onClick={() => sendCommand('Template', '')} />
        <CommandButton label="Activate Template" onClick={() => sendCommand('Module', '0')} />
      </div>

      <div className="bg-blue-50 p-4 rounded-xl">
        <p className="text-sm text-blue-700">
          <strong>Info:</strong> After applying template, set Module to 0 to activate it.
        </p>
      </div>
    </div>
  );

  const renderGpio = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('configuration')} />
      <h3 className="text-lg font-bold text-gray-800">Configure GPIO</h3>
      
      <div className="bg-white border rounded-xl p-3">
        <label className="text-sm font-medium text-gray-700">Set GPIO Function</label>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="text-xs text-gray-500">GPIO Pin</label>
            <input type="number" placeholder="0-16" className="w-full px-2 py-1 border rounded text-sm" id="gpioPin" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Function</label>
            <input type="number" placeholder="0-255" className="w-full px-2 py-1 border rounded text-sm" id="gpioFunc" />
          </div>
        </div>
        <button
          onClick={() => {
            const pin = (document.getElementById('gpioPin') as HTMLInputElement)?.value;
            const func = (document.getElementById('gpioFunc') as HTMLInputElement)?.value;
            if (pin && func) sendCommand(`GPIO${pin}`, func);
          }}
          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
        >
          Set GPIO
        </button>
      </div>

      <div className="space-y-2">
        <CommandButton label="Get GPIO Config" onClick={() => sendCommand('GPIO', '')} />
        <CommandButton label="Get Available Functions" onClick={() => sendCommand('GPIOS', '')} />
        <CommandButton label="Reset All GPIO" onClick={() => sendCommand('GPIO', '255')} />
      </div>

      <div className="bg-gray-50 p-4 rounded-xl">
        <h4 className="font-medium text-gray-700 mb-2">Common GPIO Functions</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 0 = None</li>
          <li>• 1 = Button</li>
          <li>• 21 = Switch</li>
          <li>• 52 = Relay</li>
          <li>• 56 = LED</li>
        </ul>
      </div>
    </div>
  );

  const renderTimers = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('configuration')} />
      <h3 className="text-lg font-bold text-gray-800">Configure Timers</h3>
      
      <div className="bg-gray-50 p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">Timers Status</span>
          <div className="flex gap-2">
            <button
              onClick={() => sendCommand('Timers', '0')}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
            >
              Disable All
            </button>
            <button
              onClick={() => sendCommand('Timers', '1')}
              className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
            >
              Enable All
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(num => (
          <div key={num} className="bg-white border rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-800">Timer {num}</span>
              <button
                onClick={() => sendCommand(`Timer${num}`, '')}
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded"
              >
                Get
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-gray-500">Enable</label>
                <select 
                  className="w-full px-2 py-1 border rounded text-sm"
                  onChange={(e) => setTimerInputs(prev => ({ ...prev, [`timer${num}_enable`]: e.target.value }))}
                >
                  <option value="0">OFF</option>
                  <option value="1">ON</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Mode</label>
                <select 
                  className="w-full px-2 py-1 border rounded text-sm"
                  onChange={(e) => setTimerInputs(prev => ({ ...prev, [`timer${num}_mode`]: e.target.value }))}
                >
                  <option value="0">Scheduler</option>
                  <option value="1">Sunrise</option>
                  <option value="2">Sunset</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-gray-500">Time</label>
                <input
                  type="time"
                  className="w-full px-2 py-1 border rounded text-sm"
                  onChange={(e) => setTimerInputs(prev => ({ ...prev, [`timer${num}_time`]: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Window</label>
                <input
                  type="number"
                  placeholder="±min"
                  className="w-full px-2 py-1 border rounded text-sm"
                  onChange={(e) => setTimerInputs(prev => ({ ...prev, [`timer${num}_window`]: e.target.value }))}
                />
              </div>
            </div>

            <div className="mb-2">
              <label className="text-xs text-gray-500">Days</label>
              <div className="flex gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => (
                  <button
                    key={day}
                    onClick={() => {
                      const key = `timer${num}_days`;
                      const current = timerInputs[key] || '0000000';
                      const arr = current.split('');
                      arr[idx] = arr[idx] === '1' ? '0' : '1';
                      setTimerInputs(prev => ({ ...prev, [key]: arr.join('') }));
                    }}
                    className={cn(
                      "flex-1 text-xs py-1 rounded",
                      (timerInputs[`timer${num}_days`] || '0000000')[idx] === '1'
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="text-xs text-gray-500">Repeat</label>
                <select 
                  className="w-full px-2 py-1 border rounded text-sm"
                  onChange={(e) => setTimerInputs(prev => ({ ...prev, [`timer${num}_repeat`]: e.target.value }))}
                >
                  <option value="0">OFF</option>
                  <option value="1">ON</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Output</label>
                <select 
                  className="w-full px-2 py-1 border rounded text-sm"
                  onChange={(e) => setTimerInputs(prev => ({ ...prev, [`timer${num}_output`]: e.target.value }))}
                >
                  {[1,2,3,4,5,6,7,8].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Action</label>
                <select 
                  className="w-full px-2 py-1 border rounded text-sm"
                  onChange={(e) => setTimerInputs(prev => ({ ...prev, [`timer${num}_action`]: e.target.value }))}
                >
                  <option value="0">OFF</option>
                  <option value="1">ON</option>
                  <option value="2">TOGGLE</option>
                  <option value="3">RULE</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                const enable = timerInputs[`timer${num}_enable`] || '0';
                const mode = timerInputs[`timer${num}_mode`] || '0';
                const time = timerInputs[`timer${num}_time`] || '00:00';
                const window = timerInputs[`timer${num}_window`] || '0';
                const days = timerInputs[`timer${num}_days`] || '0000000';
                const repeat = timerInputs[`timer${num}_repeat`] || '0';
                const output = timerInputs[`timer${num}_output`] || '1';
                const action = timerInputs[`timer${num}_action`] || '0';
                
                const payload = `{"Enable":${enable},"Mode":${mode},"Time":"${time}","Window":${window},"Days":"${days}","Repeat":${repeat},"Output":${output},"Action":${action}}`;
                sendCommand(`Timer${num}`, payload);
              }}
              className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Set Timer {num}
            </button>
          </div>
        ))}
      </div>

      <CommandButton label="Get All Timers" onClick={() => sendCommand('Timers', '')} />
    </div>
  );

  const renderConsole = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('main')} />
      <h3 className="text-lg font-bold text-gray-800">Console</h3>
      
      {/* Console Output */}
      <div 
        ref={consoleRef}
        className="bg-gray-900 rounded-xl p-4 h-64 overflow-y-auto font-mono text-sm"
      >
        {consoleHistory.length === 0 ? (
          <p className="text-gray-500">Enter commands below... Response will appear here.</p>
        ) : (
          consoleHistory.map((line, i) => (
            <p 
              key={i} 
              className={cn(
                "break-all whitespace-pre-wrap mb-1",
                line.startsWith('>') ? "text-cyan-400" : "text-emerald-400"
              )}
            >
              {line}
            </p>
          ))
        )}
      </div>

      {/* Console Input */}
      <form onSubmit={handleConsoleSubmit} className="flex gap-2">
        <input
          type="text"
          value={consoleInput}
          onChange={(e) => setConsoleInput(e.target.value)}
          placeholder="Enter command (e.g., POWER, STATUS 0)"
          className="flex-1 px-4 py-2 border rounded-xl font-mono"
        />
        <button
          type="submit"
          disabled={!isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>

      {/* Quick Commands */}
      <div className="grid grid-cols-4 gap-2">
        {['POWER', 'STATUS', 'STATE', 'TIMERS', 'GPIO', 'MODULE', 'WIFI', 'RESTART 1'].map(cmd => (
          <button
            key={cmd}
            onClick={() => handleQuickCommand(cmd)}
            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-mono"
          >
            {cmd}
          </button>
        ))}
      </div>
      
      {/* Clear Console */}
      <button
        onClick={() => setConsoleHistory([])}
        className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-sm"
      >
        Clear Console
      </button>
    </div>
  );

  const renderInformation = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('main')} />
      <h3 className="text-lg font-bold text-gray-800">Information</h3>
      
      <div className="space-y-3">
        <InfoRow label="Device Name" value={device.name} />
        <InfoRow label="Topic" value={device.topic} />
        <InfoRow label="IP Address" value={deviceInfo?.ipAddress} />
        <InfoRow label="Hostname" value={deviceInfo?.hostname} />
        <InfoRow label="MAC Address" value={deviceInfo?.mac} />
        <InfoRow label="Module" value={deviceInfo?.module} />
        <InfoRow label="Firmware Version" value={deviceInfo?.version} />
        <InfoRow label="Uptime" value={deviceInfo?.uptime} />
        <InfoRow label="WiFi SSID" value={deviceInfo?.ssid} />
        <InfoRow label="WiFi Signal" value={deviceInfo?.rssi ? `${deviceInfo.rssi}%` : undefined} />
        <InfoRow label="Free Memory" value={deviceInfo?.freeMemory ? `${deviceInfo.freeMemory} KB` : undefined} />
        <InfoRow label="MQTT Messages" value={deviceInfo?.mqttCount?.toString()} />
        
        {deviceInfo?.power !== undefined && (
          <InfoRow label="Power" value={`${deviceInfo.power} W`} />
        )}
        {deviceInfo?.voltage !== undefined && (
          <InfoRow label="Voltage" value={`${deviceInfo.voltage} V`} />
        )}
        {deviceInfo?.temperature !== undefined && (
          <InfoRow label="Temperature" value={`${deviceInfo.temperature} °C`} />
        )}
        {deviceInfo?.humidity !== undefined && (
          <InfoRow label="Humidity" value={`${deviceInfo.humidity} %`} />
        )}
      </div>

      <CommandButton label="Refresh Info" onClick={() => sendCommand('STATUS', '0')} />
    </div>
  );

  const renderFirmware = () => (
    <div className="space-y-4">
      <BackButton onClick={() => setCurrentPage('main')} />
      <h3 className="text-lg font-bold text-gray-800">Firmware Upgrade</h3>
      
      <div className="bg-gray-50 p-4 rounded-xl">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-500">Current Version</label>
          <p className="text-gray-800 font-mono">{deviceInfo?.version || 'Click Get Version'}</p>
        </div>
      </div>

      <div className="space-y-2">
        <CommandButton label="Get Version" onClick={() => sendCommand('STATUS', '2')} />
        <CommandButton label="Get OTA URL" onClick={() => sendCommand('OtaUrl', '')} />
        <CommandButton label="Check for Update" onClick={() => sendCommand('Upgrade', '1')} />
      </div>

      <div className="bg-amber-50 p-4 rounded-xl">
        <p className="text-sm text-amber-700">
          <strong>Warning:</strong> Firmware upgrades should be performed carefully. Make sure you have a stable network connection.
        </p>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'main': return renderMainMenu();
      case 'configuration': return renderConfiguration();
      case 'module': return renderModule();
      case 'wifi': return renderWifi();
      case 'logging': return renderLogging();
      case 'other': return renderOther();
      case 'template': return renderTemplate();
      case 'gpio': return renderGpio();
      case 'timers': return renderTimers();
      case 'console': return renderConsole();
      case 'information': return renderInformation();
      case 'firmware': return renderFirmware();
      default: return renderMainMenu();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold">Tasmota Config</h2>
              <p className="text-orange-100 text-sm">{device.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!isConnected ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-gray-600">Not connected to MQTT broker</p>
            </div>
          ) : (
            renderPage()
          )}
        </div>
      </div>
    </div>
  );
}

// Helper Components
function MenuItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow">
          <Icon className="w-5 h-5 text-gray-600" />
        </div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-2"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">Back</span>
    </button>
  );
}

function CommandButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
    >
      {label}
    </button>
  );
}

function QuickButton({ icon: Icon, label, onClick, color }: { 
  icon: React.ElementType; 
  label: string; 
  onClick: () => void;
  color: 'emerald' | 'amber' | 'blue' | 'red';
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    amber: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    blue: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    red: 'bg-red-100 text-red-700 hover:bg-red-200',
  };

  return (
    <button
      onClick={onClick}
      className={cn("flex flex-col items-center gap-1 p-3 rounded-xl transition-colors", colors[color])}
    >
      <Icon className="w-5 h-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 font-mono">
        {value || <span className="text-gray-400">-</span>}
      </span>
    </div>
  );
}
