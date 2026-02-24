export interface Device {
  id: string;
  name: string;
  topic: string;
  status: 'ON' | 'OFF' | 'UNKNOWN';
  isOnline: boolean;
  lastSeen?: string;
}

export interface MqttSettings {
  brokerUrl: string;
  port: number;
  username: string;
  password: string;
  useSSL: boolean;
}

export interface DeviceInfo {
  status: string;
  isOnline: boolean;
  lastSeen: string;
  ipAddress?: string;
  hostname?: string;
  mac?: string;
  ssid?: string;
  rssi?: number;
  module?: string;
  version?: string;
  uptime?: string;
  freeMemory?: number;
  mqttCount?: number;
  power?: number;
  voltage?: number;
  current?: number;
  temperature?: number;
  humidity?: number;
  timers?: Record<string, unknown>;
  gpio?: Record<string, unknown>;
}

export interface AppState {
  devices: Device[];
  settings: MqttSettings;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage?: string;
}
