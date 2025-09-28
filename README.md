# DS-v0

Please read the submitted Presentation for detailed information on the Project.


# DS Setup Guide

This is a deepfake-resistant verification system with a Next.js frontend and FastAPI backend for secure identity verification.

## Prerequisites

- Python 3.8+ (for backend)
- Node.js 18+ (for frontend)
- npm or yarn (for frontend package management)

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create Python Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Create Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Environment
ENV=dev
PORT=8000

# Database
DATABASE_URL=sqlite:///./DS.sqlite3

# Media Storage
MEDIA_ROOT=./media
RAW_TTL_HOURS=48

# LLM Configuration (Required)
LLM_API_KEY=your_gemini_api_key_here
LLM_MODEL=gemini-2.0-flash-exp

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:9002
DEFAULT_CALLBACK_URL=http://localhost:3000/callback
```

**Important**: You need to obtain a Google AI API key for the LLM service:

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Replace `your_gemini_api_key_here` with your actual API key

### 5. Create Media Directories

```bash
mkdir -p media/raw media/thumbs
```

### 6. Start Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`

## Frontend Setup

### 1. Navigate to Root Directory

```bash
cd ..  # If you were in the backend directory
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Create Environment Configuration (Optional)

Create a `.env.local` file for any frontend environment variables:

```env
# Add any frontend-specific environment variables here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 4. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The frontend will be available at `http://localhost:9002`

## AI/Genkit Setup (Optional)

If you want to use the AI explanations feature:

### 1. Set up Google AI API Key

Make sure you have the `LLM_API_KEY` configured in your backend `.env` file.

### 2. Start Genkit Development Server (Optional)

```bash
npm run genkit:dev
# or for auto-reload
npm run genkit:watch
```

## Verification

### Backend Health Check

Visit `http://localhost:8000/health` - you should see:

```json
{ "status": "ok" }
```

### Frontend Access

Visit `http://localhost:9002` - you should see the DS verification interface.

### API Documentation

Visit `http://localhost:8000/docs` for interactive API documentation.

## Project Structure

```
DS-v0/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # Database models
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   └── main.py         # FastAPI app
│   ├── media/              # Media storage (auto-created)
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment config
├── src/                    # Next.js frontend
│   ├── app/               # App router pages
│   ├── components/        # React components
│   ├── ai/               # AI/Genkit flows
│   └── lib/              # Utilities
├── package.json           # Frontend dependencies
└── README.md
```

## Common Issues

### Backend Issues

1. **Database errors**: Make sure the `media` directory exists and has write permissions
2. **LLM API errors**: Verify your Google AI API key is valid and has sufficient quota
3. **Port conflicts**: Change the port in the uvicorn command if 8000 is in use

### Frontend Issues

1. **Port conflicts**: The dev server runs on port 9002 by default (configured in `package.json`)
2. **API connection errors**: Ensure the backend is running on port 8000
3. **Camera/microphone access**: The verification features require HTTPS in production or localhost for development

### CORS Issues

If you encounter CORS errors, make sure the `ALLOWED_ORIGINS` in your backend `.env` includes your frontend URL.

## Production Deployment

### Backend

1. Set `ENV=production` in your `.env` file
2. Use a production database (PostgreSQL recommended)
3. Configure proper media storage (AWS S3, etc.)
4. Use a production WSGI server like Gunicorn

### Frontend

```bash
npm run build
npm start
```

## Available Scripts

### Backend

- Start server: `uvicorn app.main:app --reload --port 8000`
- Run with production settings: `uvicorn app.main:app --port 8000`

### Frontend

- Development: `npm run dev`
- Build: `npm run build`
- Start production: `npm start`
- Type checking: `npm run typecheck`
- Genkit development: `npm run genkit:dev`
