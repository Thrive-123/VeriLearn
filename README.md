# VeriLearn — AI-Powered Learning Accountability & Reward Platform

**Learn. Prove. Earn.**

VeriLearn is an AI-powered learning accountability platform designed to help students stay consistent with their learning goals. Students create their own tasks, submit evidence of their work, receive AI-generated feedback, and track their learning progress through gamification.

Instead of simply marking a task as completed, students upload evidence such as handwritten notes, code screenshots, PDFs, or assignments. Google Gemini AI analyzes the submitted evidence against the student's stated learning goal and provides a completion percentage, covered topics, missing concepts, and suggestions for improvement.

## ✨ Key Features

- **Personalized Learning Tasks:** Create tasks for coding, theory, mathematics, exam preparation, assignments, and more.
- **AI Evidence Verification:** Analyze submitted study evidence using Google Gemini AI.
- **Completion Tracking:** View completion percentages, covered areas, missing topics, and AI feedback.
- **Gamification:** Earn XP, coins, streaks, and badges to encourage consistent learning.
- **Reward Shop:** Redeem coins for available virtual rewards.
- **Learning History:** Review previous tasks, evidence submissions, and feedback.
- **Personalized Revision:** Search previous learning memories using AI embeddings and semantic similarity.
- **Secure Authentication:** JWT-based authentication and user-specific task management.

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- Axios
- React Router

### Backend
- Python
- Django
- Django REST Framework
- JWT Authentication
- SQLite for development

### AI & Retrieval
- Google Gemini API
- Gemini Embeddings
- Retrieval-Augmented Generation (RAG)
- Cosine Similarity

## ⚙️ Getting Started

### Prerequisites

- Python
- Node.js and npm
- Git
- Google Gemini API key

### 1. Clone the Repository

```bash
git clone https://github.com/Thrive-123/VeriLearn.git
cd VeriLearn
```

### 2. Set Up the Backend

Open a terminal and run:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory and add your own Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Run database migrations and start the backend:

```powershell
python manage.py migrate
python manage.py runserver
```

Backend URL: `http://127.0.0.1:8000/`

### 3. Set Up the Frontend

Open a second terminal from the project root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:5173/`

## 🔄 How It Works

1. Register or log in to your account.
2. Create a learning task with a title and description.
3. Complete the task and upload evidence of your work.
4. Receive AI-generated feedback and a completion percentage.
5. Review missing concepts and use personalized revision to revisit previous learning.
6. Earn XP and coins according to the platform's reward rules.

## 🔐 Security & Privacy

- API keys and environment variables must never be committed to GitHub.
- Users should only be able to access their own learning data.
- AI-generated feedback assists learning assessment but does not prove who personally created the submitted work.
- Keep your Gemini API key private and use your own key when running the project.

## 🚀 Future Enhancements

- Cloud deployment with a production database
- Mobile application support
- Expanded learning analytics and revision features
- Sponsor-supported physical rewards, subject to availability

## 📌 Project Status

VeriLearn is under active development. Features and implementation details may evolve as development continues.

## 👩‍💻 Repository

[GitHub — Thrive-123/VeriLearn](https://github.com/Thrive-123/VeriLearn)
