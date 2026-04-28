# 🏥 Hospital Management System – Full Stack Mobile App

A comprehensive hospital management system with role-based dashboards, AI-powered skin cancer screening, real-time appointment scheduling, lab request tracking, cleaning tasks, supply chain management, and multilingual support.

Mobile client built with React Native (Expo) and backend with Node.js + Express, MongoDB, and a separate AI microservice for dermoscopic image analysis.

**Live Backend:** https://hospital-backend-myqc.onrender.com/api  
**AI Service:** Deployed on Hugging Face (see details below) – provides skin image analysis with a Gatekeeper + Classifier.

---

# 📸 Screenshots

The following screenshots illustrate the key features and interfaces of the application.

## 🔐 Authentication & Registration

### Login Screen

<p align="center">
  <img src="https://github.com/user-attachments/assets/ec3a3273-1b1e-4b17-ae18-ed4250c9087c" alt="Login Screen" width="300"/>
</p>

### Patient Registration

<p align="center">
  <img src="https://github.com/user-attachments/assets/1a70b347-988f-4677-8587-249c7eb7ae96" alt="Patient Registration" width="300"/>
</p>

### Doctor Registration

<p align="center">
  <img src="https://github.com/user-attachments/assets/7b99d5a8-6e42-4e81-ba40-ab262abe36df" alt="Doctor Registration" width="300"/>
</p>

### Receptionist Registration

<p align="center">
  <img src="https://github.com/user-attachments/assets/57d8ad04-ef45-453a-8ad0-844ea63257ad" alt="Receptionist Registration" width="300"/>
</p>

### Lab Technician Registration

<p align="center">
  <img src="https://github.com/user-attachments/assets/2b5e9492-f862-4f82-b225-43d40365898d" alt="Lab Technician Registration" width="300"/>
</p>

### Cleaning Staff Registration

<p align="center">
  <img src="https://github.com/user-attachments/assets/f98b5b4f-1766-43b6-bcf7-c191ae86c35a" alt="Cleaning Staff Registration" width="300"/>
</p>

---

## 🏥 Role-Specific Dashboards

### Patient Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/829ccfb6-e254-4463-864e-d58e9068084d" alt="Patient Dashboard" width="300"/>
</p>

### Doctor Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/959f8eb3-5a84-49d8-b847-f940dbe648bd" alt="Doctor Dashboard" width="300"/>
</p>

### Receptionist Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/433c060d-176f-4c3d-ab6e-4ac39b1013fa" alt="Receptionist Dashboard" width="300"/>
</p>

### Lab Technician Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/e7f32275-ed06-4c46-863f-76235e9b3d43" alt="Lab Technician Dashboard" width="300"/>
</p>

### Cleaning Staff Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/57a56492-2510-45cf-bda6-b11e8444d2d1" alt="Cleaning Staff Dashboard" width="300"/>
</p>

### Admin Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/41a35de5-5f14-4257-b5bd-390457129fea" alt="Admin Dashboard" width="300"/>
</p>

---

## ☁️ Cloud & Deployment

### MongoDB Atlas

<p align="center">
  <img src="https://github.com/user-attachments/assets/9ef0eb19-092c-4ca4-bd97-2af659ae4955" alt="MongoDB Atlas" width="900"/>
</p>

### Cloudinary Media Library

<p align="center">
  <img src="https://github.com/user-attachments/assets/52e3a6c7-f44e-4be9-b35b-d78c2522be91" alt="Cloudinary Media Library" width="900"/>
</p>

### Render Backend Dashboard

<p align="center">
  <img src="https://github.com/user-attachments/assets/1cbab2e4-dde1-4027-a524-c11b8138a9e3" alt="Render Backend Dashboard" width="900"/>
</p>

### Hugging Face AI Service

<p align="center">
  <img src="https://github.com/user-attachments/assets/efff0d1f-9e05-420e-890e-67985e827f40" alt="Hugging Face AI Service" width="900"/>
</p>

---

# 🚀 Features

## 👤 Patient

- Book / reschedule / cancel appointments (15-minute slots)
- View upcoming and past appointments
- Give star-rated feedback with comments
- AI skin scanner – upload photos, get instant risk analysis
- View lab reports (completed only)
- Chatbot with AI (OpenAI/Groq)
- Multilingual UI (English, Sinhala, Tamil)
- Personalized health tips

## 👨‍⚕️ Doctor

- Set weekly availability
- View scheduled appointments
- Read patient feedback & ratings
- Create lab requests
- View lab results

## 🖥 Receptionist

- Search and create patient accounts
- Book appointments for patients
- Calendar appointment management
- Manage cleaning tasks
- AI scanner for patients

## 🔬 Lab Technician

- View pending/completed lab requests
- Accept requests
- Upload result files
- Edit/delete own requests

## 🧹 Cleaning Staff

- View cleaning tasks
- Mark tasks as completed
- Request cleaning supplies
- Track request status

## 👑 Admin

- Full user management
- Approve/reject registrations
- Manage appointments & feedback
- Manage cleaning tasks
- Approve supply requests

## 🤖 AI Skin Scanner

- Rejects non-skin photos
- Classifies lesion as Safe/Danger
- Shows confidence percentage
- Stores scan history

## 💬 AI Chatbot

- Uses OpenAI or Groq
- Answers based on patient data
- Supports voice input/output
- Clear chat history

---

# 🧱 Tech Stack

| Layer              | Technology                         |
|--------------------|------------------------------------|
| Frontend           | React Native (Expo), NativeWind    |
| Backend            | Node.js, Express, MongoDB          |
| Authentication     | JWT                                |
| File Storage       | Cloudinary                         |
| AI Service         | Python FastAPI / Hugging Face      |
| Deployment         | Render, Expo, Hugging Face         |
| Database           | MongoDB Atlas                      |

---

# 🏗 System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│               React Native Mobile App                      │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               Node.js + Express Backend                    │
└───────────────┬───────────────────────┬─────────────────────┘
                │                       │
                ▼                       ▼
        ┌──────────────┐        ┌────────────────┐
        │ MongoDB Atlas│        │  Cloudinary    │
        └──────────────┘        └───────┬────────┘
                                        ▼
                    ┌────────────────────────────┐
                    │ Hugging Face AI Service    │
                    └────────────────────────────┘
```

---

# ⚙️ Setup Instructions

## Prerequisites

- Node.js (v18+)
- MongoDB Atlas
- Cloudinary account
- OpenAI or Groq API key
- Expo CLI

---

## 1. Clone Repository

```bash
git clone https://github.com/your-username/hospital-management-system.git
cd hospital-management-system
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
SUPER_ADMIN_EMAIL=super@admin.com

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

OPENAI_API_KEY=your_openai_key
AI_PROVIDER=openai

AI_SERVICE_URL=https://your-huggingface-space.hf.space
```

Run backend:

```bash
npm run dev
```

---

## 3. Frontend Setup

```bash
cd ../app
npm install
```

Create `.env`:

```env
API_URL=https://hospital-backend-myqc.onrender.com/api
```

Run Expo:

```bash
npm start
```

---

## 4. AI Microservice

Expected response:

```json
{
  "status": "accepted",
  "classifier": {
    "label": "Danger",
    "confidence": 92.5
  }
}
```

Deploy FastAPI app to Hugging Face Spaces.

---

# 🔐 Environment Variables

## Backend

| Variable           | Description          |
|--------------------|----------------------|
| PORT               | Server Port          |
| MONGO_URI          | MongoDB connection   |
| JWT_SECRET         | JWT Secret           |
| AI_SERVICE_URL     | AI service URL       |

## Frontend

| Variable     | Description     |
|--------------|-----------------|
| API_URL      | Backend API URL |

---

# 🚢 Deployment

## Backend – Render

- Push backend to GitHub
- Create Render Web Service
- Add environment variables
- Deploy

## Database – MongoDB Atlas

- Create cluster
- Get connection string
- Add to `.env`

## Cloudinary

- Create account
- Copy credentials
- Add to backend `.env`

---

# 📚 API Endpoints Overview

| Method | Endpoint             | Access    | Description       |
|--------|----------------------|-----------|-------------------|
| POST   | /api/auth/register   | Public    | Register user     |
| POST   | /api/auth/login      | Public    | Login             |
| GET    | /api/admin/users     | Admin     | Get users         |
| POST   | /api/appointments    | Patient   | Book appointment  |
| POST   | /api/chat            | Patient   | AI chatbot        |

---

# 🧪 Testing Credentials

| Role    | Email               | Password     |
|---------|---------------------|--------------|
| Admin   | super@admin.com     | admin123     |
| Doctor  | doctor@example.com  | doctor123    |
| Patient | patient@example.com | patient123   |

---

# 🤝 Contributing

1. Fork repository
2. Create branch
3. Commit changes
4. Push branch
5. Open Pull Request

---

# 🙏 Acknowledgements

- OpenAI / Groq
- Hugging Face
- Cloudinary
- MongoDB Atlas
- Render
- Expo

---

# ❤️ Team

| Student ID | Name                       |
|------------|----------------------------|
| IT24103078 | Liyanaarachchi K L A D B   |
| IT24100701 | Louis E S                  |
| IT24100060 | Kokulan K                  |
| IT24102228 | Welgama W N Y              |
| IT24101873 | Jesmeen M B A              |
| IT24101546 | De Silva G H T D           |

---

Made with ❤️ for better healthcare management.
