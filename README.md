🏥 Hospital Management System – Full Stack Mobile App

    A comprehensive hospital management system with role‑based dashboards, AI‑powered skin cancer screening, real‑time appointment scheduling, lab request tracking, cleaning tasks, supply chain management, and multilingual support.
    Mobile client built with React Native (Expo) and backend with Node.js + Express, MongoDB, and a separate AI microservice for dermoscopic image analysis.

    Live Backend: https://hospital-backend-myqc.onrender.com/api
    AI Service: Deployed on Hugging Face (see details below) – provides skin image analysis with a Gatekeeper + Classifier.


📸 Screenshots

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

🚀 Features

  👤 Patient
  
    Book / reschedule / cancel appointments (15‑minute slots)
    
    View upcoming and past appointments
    
    Give star‑rated feedback with comments
    
    AI skin scanner – upload photos, get instant risk analysis
    
    View lab reports (completed only)
    
    Chatbot with AI (OpenAI/Groq) – asks questions about appointments, feedback, skin scans
    
    Multilingual UI (English, Sinhala, Tamil)
    
    Personalized health tip based on recent activity

  👨‍⚕️ Doctor

    Set weekly availability (15‑min granularity)
    
    View scheduled appointments, mark as completed/cancelled
    
    Read patient feedback & average rating
    
    Create lab requests for patients
    
    View lab results once completed by lab technician

  🖥 Receptionist

    Search and create patient accounts on‑the‑fly
    
    Book appointments on behalf of patients (auto‑creates patient if not exists)
    
    View all appointments (calendar view)
    
    Manage cleaning tasks – assign to staff, update status
    
    AI Scanner on behalf of patients (upload photo + assign to patient)

  🔬 Lab Technician

    View pending / accepted / completed lab requests
    
    Accept pending requests
    
    Upload result files (PDF, image) and add textual results
    
    Edit / delete own requests (accepted/completed)

  🧹 Cleaning Staff

    View assigned cleaning tasks (area, date, description)
    
    Mark tasks as completed (timestamped)
    
    Request cleaning supplies – item, quantity, notes
    
    Track request status (pending → approved → delivered)

  👑 Admin (Super Admin)

    Full user management (create, edit, delete – except admins)
    
    Approve / reject new registrations for doctor, receptionist, lab tech, cleaning staff
    
    View and delete all appointments & feedback
    
    Manage cleaning tasks (create, assign, edit, delete)
    
    Approve / deliver supply requests

  🤖 AI Skin Scanner (Gatekeeper + Classifier)
  
    Rejects non‑skin photos (lighting, blur, no skin)
    
    Classifies lesion as Safe or Danger with confidence %
    
    Shows uncertainty when confidence < 65%
    
    Stores every scan with full AI response; patients and receptionists can view history

  💬 AI Chatbot

    Conversational assistant using OpenAI or Groq (Llama 3.3)
    
    Provides answers based on patient’s own data (appointments, feedback, scans)
    
    Supports text‑to‑speech (Expo Speech) and voice input (optional)
    
    Clear chat history button

🧱 Tech Stack

  Layer	Technology
  
    Frontend	React Native (Expo) – TypeScript (optional), Tailwind via NativeWind
    Backend	Node.js, Express, MongoDB (Mongoose)
    Authentication	JWT (Bearer token)
    File Storage	Cloudinary (images for skin scans & lab results)
    AI Service	Python FastAPI / Hugging Face (Gatekeeper + Classifier) – separate repo
    Deployment	Backend: Render; Frontend: Expo Go / EAS; AI Service: Hugging Face Spaces
    Database	MongoDB Atlas
    Real‑time	Not used (standard REST)
    
🏗 System Architecture

    ┌─────────────────────────────────────────────────────────────────┐
    │                    React Native Mobile App                      │
    │  (Patient, Doctor, Receptionist, Lab Tech, Cleaning, Admin)     │
    └───────────────────────────────┬─────────────────────────────────┘
                                    │ HTTPS / API
                                    ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                     Node.js + Express Backend                    │
    │  (JWT auth, role middleware, REST endpoints)                    │
    │  ▼ models: User, Appointment, Availability, LabRequest,         │
    │    Feedback, SkinImage, CleaningTask, SupplyRequest, Chat       │
    └───────────────┬─────────────────────────────┬───────────────────┘
                    │                             │
                    ▼                             ▼
            ┌──────────────┐              ┌─────────────────┐
            │ MongoDB Atlas│              │   Cloudinary     │
            │  (database)  │              │ (image storage)  │
            └──────────────┘              └────────┬────────┘
                                                    │
                                                    ▼
            ┌──────────────────────────────────────────────────────┐
            │         AI Microservice (Hugging Face)               │
            │  - Gatekeeper: reject non‑skin images                │
            │  - Classifier: predict Danger / Safe + confidence    │
            └──────────────────────────────────────────────────────┘

            
⚙️ Setup Instructions

    Prerequisites
    Node.js (v18+)
    
    MongoDB Atlas account (or local MongoDB)
    
    Cloudinary account
    
    OpenAI API key or Groq API key
    
    Expo CLI (npm install -g expo-cli) or use Expo Go app
    
    (Optional) Python environment for AI service – but you can rely on the deployed Hugging Face Space

  1. Clone the repository

    git clone https://github.com/your-username/hospital-management-system.git
    cd hospital-management-system
    
  2. Backend Setup

    cd backend
    npm install
    
  Create a .env file in backend/ with the following variables:

    env

    PORT=5000
    MONGO_URI=your_mongodb_atlas_connection_string
    JWT_SECRET=your_jwt_secret
    SUPER_ADMIN_EMAIL=super@admin.com
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    OPENAI_API_KEY=your_openai_key   # or GROQ_API_KEY
    AI_PROVIDER=openai               # or 'groq'
    AI_SERVICE_URL=https://your-huggingface-space.hf.space   # skin analysis service


  Then run:

    npm run dev   # or npm start
    The backend will be available at http://localhost:5000.

  3. Frontend (React Native / Expo)

    cd ../app
    npm install

  Create a .env file in app/ (or set in app.json extras):

    env
  
    API_URL=https://hospital-backend-myqc.onrender.com/api   # your deployed backend
    Alternatively, you can modify app/src/api/axios.js to point to your backend IP for local development.

  Then start the Expo development server:

    npm start
    Scan the QR code with Expo Go (Android) or Camera (iOS) to run the app.

  4. AI Microservice (Skin Analysis)

    The backend expects an AI service at AI_SERVICE_URL/analyze that accepts { image_url: string } and returns:

    json
    
    {
      "status": "accepted" | "rejected",
      "gatekeeper": { "reason": "...", "detail": "..." },
      "classifier": { "label": "Danger" | "Safe", "confidence": 92.5 }
    }
    
    You can deploy the provided skin-ai service (FastAPI) to Hugging Face Spaces.
    Update AI_SERVICE_URL in backend .env accordingly.

  5. Database Initialisation
     
    MongoDB Atlas automatically creates collections when first used.

    Ensure the super admin exists (seed manually or through registration – super admin email is set in .env; only that email can register as admin).

🔐 Environment Variables Summary

Backend (.env)

    Variable	Description
    PORT	Server port (default 5000)
    MONGO_URI	MongoDB Atlas connection string
    JWT_SECRET	Secret for JWT signing
    SUPER_ADMIN_EMAIL	Email that can register as admin
    CLOUDINARY_*	Cloudinary credentials for image uploads
    OPENAI_API_KEY	OpenAI API key (or GROQ_API_KEY)
    AI_PROVIDER	openai or groq
    AI_SERVICE_URL	URL of the skin analysis AI service
    
  Frontend (.env or app.json extra)
  
    Variable	    Description
    apiUrl	      Backend API base URL (e.g., .../api)
    
🚢 Deployment

  Backend on Render
  
    Push backend code to GitHub.
    
    Create a new Web Service on Render.
    
    Set build command: npm install
    
    Start command: node server.js (or npm start)
    
    Add all environment variables in Render dashboard.
    
    Deploy – the backend will be live at https://your-app.onrender.com.

  AI Service on Hugging Face Spaces
  
    Create a new Space (Docker or Gradio).
    
    Upload your FastAPI app + requirements.txt.
    
    Set environment variables (if any) in Space secrets.
    
    The Space URL becomes your AI_SERVICE_URL.

  Database – MongoDB Atlas
  
    Create a cluster (free tier M0).

    Whitelist all IPs (0.0.0.0/0) for development or restrict to Render IPs.

    Get the connection string and set MONGO_URI.

  Cloudinary
  
    Create a Cloudinary account.

    From dashboard, copy Cloud name, API Key, API Secret.

  Set those in backend .env.

  Frontend (Expo) – No deployment needed for development; for production you can build APK/IPA via EAS Build.

📚 API Endpoints Overview (Selected)


    Method	    Endpoint	                        Access	                  Description
    POST	      /api/auth/register	              Public	                  Register (patient, doctor, etc)
    POST	      /api/auth/login	                  Public	                  Login + JWT
    GET	        /api/admin/users	                Admin	                    List all users
    PUT	        /api/admin/approve-user/:id	      Admin	                    Approve pending user
    POST	      /api/appointments	                Patient	                  Book appointment
    POST	      /api/appointments/receptionist	  Receptionist	            Book for patient (creates if new)
    GET	        /api/availability/doctor/:id	    Authenticated	            Get available slots for a doctor
    POST	      /api/skin-images	                Patient/Receptionist	    Upload skin image (AI analysis)
    GET	        /api/lab-requests/patient	        Patient	                  Get completed lab reports
    POST	      /api/lab-requests	                Doctor	                  Create lab request
    PUT	        /api/lab-requests/:id/complete	  LabTechnician	            Upload result file/text
    GET	        /api/cleaning-tasks/my	          CleaningStaff	            Get my tasks
    POST	      /api/supply-requests	            CleaningStaff	            Request supplies
    POST	      /api/chat	                        Patient	                  Send message to AI chatbot
    GET	        /api/patient/tip	                Patient	                  Get AI‑generated health tip

    For a full list, check the routes/ folder in backend.

🧪 Testing Credentials (Example)

  Use these after seeding or registering:

    
    Role	            Email	Password	                   Status
    Admin (super)	    super@admin.com	admin123	         approved
    Doctor	          doctor@example.com	doctor123	     approved
    Patient	          patient@example.com	patient123	   approved
    Receptionist	    reception@example.com	rec123	     approved
    Lab Technician	  lab@example.com	lab123	           approved
    Cleaning Staff	  clean@example.com	clean123	       approved

  Note: Non‑admin roles initially have status: pending when registering. Admin must approve them before they can log in.

🤝 Contributing

    Fork the repository.
    
    Create a feature branch (git checkout -b feature/amazing).
    
    Commit changes (git commit -m 'Add amazing feature').
    
    Push to the branch (git push origin feature/amazing).
    
    Open a Pull Request.

🙏 Acknowledgements

    OpenAI / Groq for LLM API
    
    Hugging Face for hosting AI model
    
    Cloudinary for image storage
    
    MongoDB Atlas for database
    
    Render for backend hosting
    
    Expo for React Native toolchain

Made with ❤️ for better healthcare management.

Team 

    Student ID 	        Name  
    IT24103078 	        Liyanaarachchi K L A D B 
    IT24100701 	        Louis E S 
    IT24100060 	        Kokulan K. 
    IT24102228 	        Welgama W. N. Y 
    IT24101873 	        Jesmeen M.B.A 
    IT24101546 	        De Silva G. H. T. D. 


