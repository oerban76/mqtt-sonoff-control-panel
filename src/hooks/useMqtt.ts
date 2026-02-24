import { useState, useEffect, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
import { Device, MqttSettings, DeviceInfo } from '../types';

interface UseMqttReturn {
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  errorMessage: string;
  connect: (settings: MqttSettings) => void;
  disconnect: () => void;
  sendCommand: (device: Device, command: string, payload?: string) => void;
  sendRawCommand: (topic: string, command: string, payload?: string) => void;
  subscribeToDevice: (topic: string) => void;
  deviceStatuses: Record<string, DeviceInfo>;
  lastMessage: { topic: string; payload: string } | null;
}

export function useMqtt(): UseMqttReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState('');
  const [deviceStatuses, setDeviceStatuses] = useState<Record<string, DeviceInfo>>({});
  const [lastMessage, setLastMessage] = useState<{ topic: string; payload: string } | null>(null);
  const clientRef = useRef<MqttClient | null>(null);
  const subscribedTopicsRef = useRef<Set<string>>(new Set());

  const subscribeToDevice = useCallback((topic: string) => {
    if (clientRef.current && clientRef.current.connected && !subscribedTopicsRef.current.has(topic)) {
      // Subscribe hanya ke topic yang diperlukan, bukan wildcard
      const topics = [
        `stat/${topic}/POWER`,
        `stat/${topic}/RESULT`,
        `stat/${topic}/STATUS`,
        `stat/${topic}/STATUS1`,
        `stat/${topic}/STATUS2`,
        `stat/${topic}/STATUS4`,
        `stat/${topic}/STATUS5`,
        `stat/${topic}/STATUS6`,
        `stat/${topic}/STATUS7`,
        `stat/${topic}/STATUS8`,
        `stat/${topic}/STATUS11`,
        `tele/${topic}/LWT`,
        `tele/${topic}/STATE`,
        `tele/${topic}/SENSOR`,
      ];
      
      clientRef.current.subscribe(topics, { qos: 0 }, (err) => {
        if (!err) {
          subscribedTopicsRef.current.add(topic);
          // Request initial power status only
          clientRef.current?.publish(`cmnd/${topic}/POWER`, '', { qos: 0, retain: false });
        }
      });
    }
  }, []);

  const connect = useCallback((settings: MqttSettings) => {
    if (clientRef.current) {
      clientRef.current.end(true);
    }

    setConnectionStatus('connecting');
    setErrorMessage('');

    const protocol = settings.useSSL ? 'wss' : 'ws';
    const wsPort = settings.useSSL ? 8884 : 8083;
    const url = `${protocol}://${settings.brokerUrl}:${wsPort}/mqtt`;

    const options: mqtt.IClientOptions = {
      username: settings.username,
      password: settings.password,
      clientId: `tasmota_web_${Math.random().toString(16).substring(2, 10)}`,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      keepalive: 60,
      protocolVersion: 4,
      rejectUnauthorized: false,
    };

    try {
      const client = mqtt.connect(url, options);
      clientRef.current = client;

      client.on('connect', () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        setErrorMessage('');
        subscribedTopicsRef.current.clear();
      });

      client.on('error', (err) => {
        setErrorMessage(err.message || 'Connection error');
        setConnectionStatus('error');
      });

      client.on('close', () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      client.on('offline', () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
      });

      client.on('message', (topic, message) => {
        const payload = message.toString();
        const parts = topic.split('/');
        
        // Store last message for console
        setLastMessage({ topic, payload });
        
        if (parts.length >= 3) {
          const deviceTopic = parts[1];
          const type = parts[0];
          const command = parts[2];

          // Update device status based on message type
          setDeviceStatuses(prev => {
            const current = prev[deviceTopic] || { status: 'UNKNOWN', isOnline: false };
            let updated = { ...current, lastSeen: new Date().toLocaleTimeString() };

            if (type === 'stat' && command === 'POWER') {
              updated.status = payload;
              updated.isOnline = true;
            } else if (type === 'stat' && command === 'RESULT') {
              try {
                const result = JSON.parse(payload);
                if (result.POWER !== undefined) {
                  updated.status = result.POWER;
                }
                if (result.Module !== undefined) {
                  updated.module = result.Module;
                }
                updated.isOnline = true;
              } catch {
                // Not JSON
              }
            } else if (type === 'stat' && command.startsWith('STATUS')) {
              try {
                const result = JSON.parse(payload);
                
                // STATUS 0
                if (result.Status) {
                  updated.module = result.Status.Module;
                }
                // STATUS 1
                if (result.StatusPRM) {
                  updated.uptime = result.StatusPRM.Uptime;
                }
                // STATUS 2
                if (result.StatusFWR) {
                  updated.version = result.StatusFWR.Version;
                }
                // STATUS 4
                if (result.StatusMEM) {
                  updated.freeMemory = result.StatusMEM.Free;
                }
                // STATUS 5
                if (result.StatusNET) {
                  updated.ipAddress = result.StatusNET.IPAddress;
                  updated.hostname = result.StatusNET.Hostname;
                  updated.mac = result.StatusNET.Mac;
                }
                // STATUS 6
                if (result.StatusMQT) {
                  updated.mqttCount = result.StatusMQT.MqttCount;
                }
                // STATUS 8 - Sensors
                if (result.StatusSNS) {
                  const sns = result.StatusSNS;
                  if (sns.ENERGY) {
                    updated.power = sns.ENERGY.Power;
                    updated.voltage = sns.ENERGY.Voltage;
                    updated.current = sns.ENERGY.Current;
                  }
                  if (sns.AM2301) {
                    updated.temperature = sns.AM2301.Temperature;
                    updated.humidity = sns.AM2301.Humidity;
                  }
                  if (sns.DHT11) {
                    updated.temperature = sns.DHT11.Temperature;
                    updated.humidity = sns.DHT11.Humidity;
                  }
                  if (sns.DS18B20) {
                    updated.temperature = sns.DS18B20.Temperature;
                  }
                }
                // STATUS 11
                if (result.StatusSTS) {
                  updated.uptime = result.StatusSTS.Uptime;
                  if (result.StatusSTS.Wifi) {
                    updated.ssid = result.StatusSTS.Wifi.SSId;
                    updated.rssi = result.StatusSTS.Wifi.RSSI;
                  }
                }
                updated.isOnline = true;
              } catch {
                // Not JSON
              }
            } else if (type === 'tele' && command === 'LWT') {
              updated.isOnline = payload === 'Online';
            } else if (type === 'tele' && command === 'STATE') {
              try {
                const result = JSON.parse(payload);
                if (result.POWER !== undefined) {
                  updated.status = result.POWER;
                }
                if (result.Uptime) {
                  updated.uptime = result.Uptime;
                }
                if (result.Wifi) {
                  updated.ssid = result.Wifi.SSId;
                  updated.rssi = result.Wifi.RSSI;
                }
                updated.isOnline = true;
              } catch {
                // Not JSON
              }
            } else if (type === 'tele' && command === 'SENSOR') {
              try {
                const result = JSON.parse(payload);
                if (result.ENERGY) {
                  updated.power = result.ENERGY.Power;
                  updated.voltage = result.ENERGY.Voltage;
                  updated.current = result.ENERGY.Current;
                }
                if (result.AM2301) {
                  updated.temperature = result.AM2301.Temperature;
                  updated.humidity = result.AM2301.Humidity;
                }
                if (result.DHT11) {
                  updated.temperature = result.DHT11.Temperature;
                  updated.humidity = result.DHT11.Humidity;
                }
                if (result.DS18B20) {
                  updated.temperature = result.DS18B20.Temperature;
                }
                updated.isOnline = true;
              } catch {
                // Not JSON
              }
            }

            return { ...prev, [deviceTopic]: updated };
          });
        }
      });

    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect');
      setConnectionStatus('error');
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.end(true);
      clientRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    subscribedTopicsRef.current.clear();
  }, []);

  const sendCommand = useCallback((device: Device, command: string, payload: string = '') => {
    if (clientRef.current && clientRef.current.connected) {
      const topic = `cmnd/${device.topic}/${command}`;
      clientRef.current.publish(topic, payload, { qos: 0, retain: false });
    }
  }, []);

  const sendRawCommand = useCallback((deviceTopic: string, command: string, payload: string = '') => {
    if (clientRef.current && clientRef.current.connected) {
      const topic = `cmnd/${deviceTopic}/${command}`;
      clientRef.current.publish(topic, payload, { qos: 0, retain: false });
    }
  }, []);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.end(true);
      }
    };
  }, []);

  return {
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
  };
}

export { type UseMqttReturn };
