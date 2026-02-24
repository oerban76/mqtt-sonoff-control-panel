# 🏠 Sonoff Tasmota MQTT Controller

Aplikasi web profesional untuk mengontrol perangkat Sonoff Tasmota jarak jauh menggunakan protokol MQTT.

![Tasmota Controller](https://img.shields.io/badge/Tasmota-Controller-blue?style=for-the-badge)
![MQTT](https://img.shields.io/badge/MQTT-Protocol-green?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)

## ✨ Fitur

- 🔌 **Koneksi MQTT** - Koneksi aman ke broker MQTT via WebSocket (WSS)
- 📱 **Device Management** - Tambah, edit, dan hapus perangkat
- 🎮 **Kontrol Penuh** - Power ON/OFF, Status, Restart, Sensor
- ⚙️ **Settings** - Konfigurasi broker, port, dan credential
- 💾 **Persistent Storage** - Pengaturan tersimpan di localStorage
- 📊 **Real-time Status** - Status online/offline dan power state
- 🎨 **UI Modern** - Desain profesional dan responsive

## 🚀 Deploy ke GitHub Pages

### Langkah 1: Fork atau Clone Repository

```bash
git clone https://github.com/USERNAME/REPO-NAME.git
cd REPO-NAME
```

### Langkah 2: Push ke GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git push -u origin main
```

### Langkah 3: Aktifkan GitHub Pages

1. Buka repository di GitHub
2. Klik **Settings** → **Pages**
3. Di bagian **Source**, pilih **GitHub Actions**
4. Tunggu workflow selesai (cek tab **Actions**)
5. Aplikasi akan tersedia di: `https://USERNAME.github.io/REPO-NAME/`

## 🛠️ Development Lokal

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build
```

## 📡 Konfigurasi MQTT

### Broker Default
- **URL**: `f56a4a2eb43d41c78add8e851e256d5c.s1.eu.hivemq.cloud`
- **Port**: `8884` (WebSocket Secure)
- **SSL/TLS**: Enabled

### Format Topic Tasmota
| Fungsi | Topic |
|--------|-------|
| Command | `cmnd/[device]/POWER` |
| Status | `stat/[device]/POWER` |
| LWT | `tele/[device]/LWT` |

### Contoh Command
```
# Power Control
cmnd/sonoff-dapur/POWER ON
cmnd/sonoff-dapur/POWER OFF
cmnd/sonoff-dapur/POWER TOGGLE

# Get Status
cmnd/sonoff-dapur/STATUS

# Restart
cmnd/sonoff-dapur/RESTART 1

# Get Sensor Data
cmnd/sonoff-dapur/STATUS 8
```

## 🔧 Menambah Device

1. Klik tombol **+ Add Device**
2. Masukkan nama device (contoh: "Lampu Dapur")
3. Masukkan MQTT topic (contoh: "sonoff-dapur")
4. Klik **Add Device**

## 📱 Screenshot

### Dashboard
- Kontrol multiple device dalam satu halaman
- Status real-time (Online/Offline, ON/OFF)
- Quick actions (Power, Status, Restart, Sensor)

### Settings
- Konfigurasi broker MQTT
- Manajemen credential
- Device management

## 🔒 Keamanan

- Credential disimpan di localStorage browser
- Koneksi menggunakan WSS (WebSocket Secure)
- Tidak ada data yang dikirim ke server pihak ketiga

## 📄 Lisensi

MIT License - Bebas digunakan dan dimodifikasi.

---

Made with ❤️ for IoT enthusiasts
