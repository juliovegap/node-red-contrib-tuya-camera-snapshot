# node-red-contrib-tuya-camera-snapshot

[![NPM Version](https://img.shields.io/npm/v/node-red-contrib-tuya-file-decrypt.svg)](https://www.npmjs.com/package/node-red-contrib-tuya-file-decrypt)
[![Node-RED](https://img.shields.io/badge/Node--RED-Node-blue.svg)](https://flows.nodered.org/node/node-red-contrib-tuya-file-decrypt)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Build Status](https://img.shields.io/github/actions/workflow/status/<your-user>/node-red-contrib-tuya-file-decrypt/publish.yml)](https://github.com/<your-user>/node-red-contrib-tuya-file-decrypt)

A Node‑RED node that call Tuya Open API to perform a **camera snapshot**, decrypts **Tuya encrypted picture** (AES‑CBC) and returns the resulting image as Base64 or binary Buffer.

This is especially useful for **Tuya‑based cameras and sensors** like doorbells, which are motion sensor activated.

Besides the Tuya credentials, it is **paramount** to enable the **Camera Service** Tuya API on your Tuya IOT Platform (Cloud -> <Your Project> -> Service API and ativate "Camera Service")

---

## ✨ Features

- Connects to **Tuya OpenAPI**
- Calls the **Capture An Image** Camera Service API
- Downloads encrypted picture files
- Decrypts AES‑CBC with PKCS7 padding
- Returns the image in:
  - `msg.payload` → Base64
  - `msg.image` → Buffer (binary)
- Fully compatible with:
  - Node‑RED standalone
  - Node‑RED add‑on for Home Assistant
  - Docker deployments
- Zero Python dependencies — **pure Node.js**

---

## 📦 Installation

### From Node‑RED Palette Manager

`Menu → Manage Palette → Install → node-red-contrib-tuya-file-decrypt`

### From NPM

`npm install node-red-contrib-tuya-file-decrypt`

### Home Assistant (Node‑RED Add‑on)

`cd /config/node-red`

`npm install node-red-contrib-tuya-file-decrypt`

Then restart the add‑on.

---

## 🧩 Node Configuration

The node requires your Tuya Cloud credentials:

| Field       | Description |
|-------------|-------------|
| Access ID   | Tuya Cloud Access ID |
| Access Key  | Tuya Cloud Access Key |
| Endpoint    | Tuya API endpoint (default: EU) |
| Device ID   | Device that owns the encrypted file |

Supported endpoints:

- `https://openapi.tuyaeu.com` (EU)
- `https://openapi.tuyacn.com` (China)
- `https://openapi.tuyaus.com` (US)
- `https://openapi.tuyain.com` (India)
