# Meshark AI CV Builder 🚀

Meshark AI CV Builder is an intelligent web application designed to help users create highly professional, ATS-friendly CVs through a simple conversational interface. 

Instead of filling out tedious forms, users chat with **Meshark AI**, which seamlessly extracts their professional background—such as work experience, education, skills, hobbies, languages, and referees—and automatically compiles it into a beautiful, styled PDF document.

**Live Demo:** [https://sherkcvai.netlify.app](https://sherkcvai.netlify.app)

---

## ✨ Features
- **Conversational AI Builder**: Powered by LLaMA 3.1 (via Groq), the assistant fluidly interviews the user to extract all necessary CV data.
- **Dynamic PDF Compilation**: Automatically maps the conversational data into professional LaTeX templates.
- **Multiple CV Styles**: Choose between 'Modern' and 'Colorful' document templates.
- **Instant Preview**: View the generated CV live within the browser without having to download it first. 
- **Voice Dictation**: Support for web speech recognition so users can dictate their responses.
- **Firebase Authentication**: Secure Google Sign-In backend to allow users to securely save and access their generated CVs.

## 🛠️ Technology Stack
### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS, Lucide React icons
- **Deployment**: Netlify

### Backend
- **Framework**: FastAPI (Python)
- **AI Integration**: Groq API (LLaMA 3.1 8B Instant)
- **PDF Engine**: YTO Tech LaTeX compiler API 
- **Database**: PostgreSQL (via SQLAlchemy)
- **Authentication**: Firebase Admin SDK
- **Deployment**: Render

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- Python 3.9+
- PostgreSQL
- API Keys: Firebase Web/Admin configs, a Groq API Key

### 1. Clone & Install
```bash
git clone https://github.com/Meshark1/Meshark-AI-CV-Builder.git
cd Meshark-AI-CV-Builder
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Create a .env file and add your Vite API URL and Firebase Configs:
# VITE_API_URL=http://localhost:8080
# VITE_FIREBASE_API_KEY=...

npm run dev
```

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt

# Create a .env file with your database URI and Groq API key:
# DATABASE_URL=postgresql://user:password@localhost/dbname
# GROQ_API_KEY=your_key_here

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

## 🤝 Contributing
Open an issue or submit a pull request if you'd like to add new LaTeX templates, new AI features, or fix any bugs!
