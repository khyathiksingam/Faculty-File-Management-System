# Faculty File Management System (FFMS)

### Vallurupalli Nageswara Rao Vignana Jyothi Institute of Engineering & Technology (VNR VJIET)

A secure, modern, responsive full-stack web application designed for colleges and universities to organize, search, preview, share, version, and manage academic and administrative files in a Google Drive-style interface.

---

## 🌟 Key Features

- **Role-Based Access Control (RBAC)**: Distinct permissions and dashboards for **Admin**, **Head of Department (HOD)**, and **Faculty Members**.
- **OCR Search Inside Scanned Documents**: Background OCR indexing using `tesseract.js` for images and `pdf-parse` for PDFs, enabling full-text keyword search inside scanned exam papers and documents.
- **In-App File Previews**: Rich multi-format previewers for PDF documents, zoomable/rotatable images, video streaming, audio player, CSV tabular data spreadsheets, and raw OCR text inspector.
- **Multi-Target File Sharing**: Share files with individual faculty or entire departments with granular permissions (`View Only`, `View & Download`, `Edit / Manage`).
- **Preserved Version History**: Upload new iterations without overwriting; inspect revision notes, download prior versions, and restore past versions with one click.
- **Recycle Bin & Recovery**: Soft-delete safety net with restoration and permanent deletion capabilities.
- **Storage Analytics**: Real-time quota monitoring, department storage breakdown, file category distribution, and top largest documents tracker.
- **Mobile Responsive & Network Ready**: Accessible across desktop, tablet, and mobile devices connected to the local network.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18 or higher)
- npm

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/khyathiksingam/Faculty-File-Management-System.git
cd Faculty-File-Management-System

# Install root & backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Build & Run
```bash
# Build frontend assets
npm run build --prefix frontend

# Start backend server
node backend/src/server.js
```

### 4. Accessing the Application
- **Local Desktop**: `http://localhost:5000`
- **Mobile / Local Network**: `http://<YOUR_LAN_IP>:5000` (e.g. `http://192.168.1.236:5000`)

---

## 🔑 Default Credentials

| Role | Username | Password |
| :--- | :--- | :--- |
| **System Administrator** | `admin` | `Admin@123` |


---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js
- **Database**: SQLite via `sql.js` (WebAssembly)
- **OCR Engine**: Tesseract.js & pdf-parse
- **Authentication**: JWT & bcryptjs
- **Storage**: Private Local Object Storage with UUID hashing
