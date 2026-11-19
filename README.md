# TaskMe

**TaskMe** is a full-stack task planning and assignment management platform. It helps teams organize operational tasks, assign work to qualified users, coordinate responses, and monitor activity through notifications and real-time messaging.

The application combines a React and TypeScript frontend with a Node.js/Express API and MongoDB persistence.

## Features

- **Role-based access control:** SUPER_ADMIN, COORDINATEUR, and AUDITEUR.
- **User management:** profiles, roles, specialties, grades, qualifications, and account status.
- **Task management:** creation, modification, deletion, scheduling, required skills, remuneration, and supporting documents.
- **Assignment workflows:**
  - Manual assignment.
  - Semi-automatic candidate selection based on specialties, grades, availability, and workload.
  - AI-assisted assignment recommendations using OpenAI.
  - Assignment acceptance, refusal, and delegation.
- **Vehicle management:** vehicle registration, availability checking, and task allocation.
- **Communication:** direct messaging and task-related group conversations.
- **Notifications and activity history:** tracking operational events and assignment activities.
- **Real-time communication:** Socket.IO integration.
- **Email notifications:** Nodemailer integration.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, React Router, Axios |
| UI | Material UI, Bootstrap, Tailwind CSS, Lucide React |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JWT, HTTP-only cookies, bcrypt |
| Real-time | Socket.IO |
| AI integration | OpenAI API |
| Email | Nodemailer |

## Project Structure

```text
TaskMe/
├── backend/
│   ├── controllers/
│   ├── emails/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── index.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
│
└── README.md
```

## Prerequisites

- Node.js and npm
- MongoDB (local or cloud instance)
- OpenAI API key (for AI-assisted assignment)
- SMTP credentials (for email notifications)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/asmae224/TaskMe.git
cd TaskMe
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend/` directory:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_jwt_secret
OPENAI_API_KEY=your_openai_api_key

EMAIL_HOST=your_smtp_host
EMAIL_PORT=587
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
```

Start the backend:

```bash
npm run dev
```

The API runs on `http://localhost:3000` by default.

### 3. Frontend setup

Open another terminal:

```bash
cd frontend
npm install
npm start
```

The React development server normally runs on `http://localhost:3000`. If that port is already occupied by the backend, choose another available port when prompted.

**Configuration note:** The current frontend references a deployed Render API, while the backend CORS configuration allows the deployed Vercel frontend domain. These settings must be adjusted when using different environments.

## Core Application Domains

### User Roles

| Role | Responsibilities |
|---|---|
| SUPER_ADMIN | Platform administration |
| COORDINATEUR | Task coordination and assignment management |
| AUDITEUR | Assigned tasks and assignment responses |

### Assignment Management

TaskMe provides three assignment approaches:

1. **Manual:** administrators select the users to assign.
2. **Semi-automatic:** candidates are selected according to task requirements, availability, and workload.
3. **AI-assisted:** OpenAI generates assignment recommendations based on task and user information.

Users can accept, refuse, or delegate assignments through the implemented workflows.

### Real-Time Communication

Socket.IO supports real-time connection events and user-targeted notifications. The platform also provides direct conversations and task-related group discussions.

## Available Scripts

### Backend

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start with Nodemon |
| `npm start` | Start the production server |

### Frontend

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm start` | Start development server |
| `npm run build` | Generate production build |
| `npm test` | Run configured tests |

## Deployment

The current project configuration references:

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB

For a different deployment environment, configure the API URL, CORS allowed origins, and environment variables accordingly.

## Security Considerations

- Never commit API keys, database credentials, or `.env` files.
- Use a strong and unique JWT secret.
- Restrict database and SMTP credentials.
- Configure production CORS origins explicitly.
- Review authentication, authorization, file uploads, and cookie settings before production deployment.

## Project Status

This repository contains the TaskMe frontend and backend source code. The documentation reflects the implementation currently present in the repository. Automated test coverage and production readiness have not been independently verified.

---

**Repository:** [TaskMe on GitHub](https://github.com/asmae224/TaskMe)
