# AURA — AI Classroom Management Suite

AURA is a modern, full-stack biometric classroom management application featuring automatic face recognition attendance and immediate parental alert messaging.

## Tech Stack Overview

- **Backend (Python)**: Flask API service using OpenCV (Haar Cascades for face detection, LBPH for face recognition), Pandas for local logging, and Twilio for parental SMS alerts.
- **Backend (Node.js)**: Express.js REST API layer that handles student profiles, scheduled exam data, scores, and historical attendance logs.
- **Database (SQLite)**: A shared SQLite file (`classroom.db`) accessed simultaneously by both Node.js (via `better-sqlite3`) and Python Flask.
- **Frontend**: A React SPA styled with a dark glassmorphic theme using Tailwind CSS and Recharts for academic analytics.

---

## 1. Setup Instructions

Clone/navigate to the workspace root directory.

### Database Setup
No manual database setup is necessary! Starting the Node.js Express server automatically opens/creates the SQLite database file (`node-backend/classroom.db`) and executes the schema migration queries.

### Node.js Backend Setup
1. Navigate to the Node.js backend directory:
   ```bash
   cd node-backend
   ```
2. Create/verify the `.env` configuration file:
   ```env
   PORT=5000
   DB_PATH=./classroom.db
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Python Flask Backend Setup
1. Navigate to the Python backend directory:
   ```bash
   cd python-backend
   ```
2. Create/verify the `.env` configuration file:
   ```env
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_FROM_NUMBER=+1xxxxxxxxxx
   DB_PATH=../node-backend/classroom.db
   ```
   *Note: If no Twilio credentials are configured, the backend logs the SMS message content in the console and continues without throwing error exceptions.*
3. Set up a Python virtual environment and install packages:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

### React Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 2. Running the Servers Simultaneously

To run all three servers together, open three terminal sessions in the respective folders:

1. **Express REST API (Port 5000)**:
   ```bash
   cd node-backend
   npm run dev
   ```
2. **Flask AI Engine (Port 5001)**:
   ```bash
   cd python-backend
   source venv/bin/activate
   python app.py
   ```
3. **React Frontend (Vite Dev Server)**:
   ```bash
   cd frontend
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 3. Core Biometric & AI Workflow

### Step A: Student Registration
Open the dashboard and use the **Quick Student Registration** form to register a new student (Name, Roll, Class, Parent Phone). This creates a profile record with a unique auto-incremented integer ID.

### Step B: Capturing the Face Dataset
1. Go to the **Attendance** page.
2. In the students list table, identify your registered student and click **Capture Faces**.
3. *webcam capture*: The Flask server starts the webcam, records 30 grayscale cropped frontal face image frames using Haar Cascades, and saves them to `dataset/{student_id}/`.
4. *simulation*: To capture/recognize on headless instances or servers without a physical webcam, toggle the scanner mode switch to **Mock Scan** in the top control panel. This will generate mock facial vectors and run mock recognitions.

### Step C: Training the LBPH Model
After registering students and capturing their face samples, click the **Train AI Recognizer** button in the top control panel of the Attendance page. This processes the image directory, creates the mathematical LBPH model, and outputs the model parameters to `trainer/trainer.yml` and student mappings to `trainer/labels.pkl`.

### Step D: Triggering Attendance Sessions
1. Click **Start Biometric Scanner** in the Attendance dashboard.
2. The scanner will run and open a local webcam stream window (or trigger mock recognition in Mock mode).
3. Once a student's face is recognized with acceptable confidence:
   - It will update the local SQLite database state and append to `attendance.csv` on the Flask server.
   - If they were previously logged as `Absent` today, it will call Twilio to send a "late arrival/present" notification SMS to their parent.

### Step E: Dispatching Absence Alerts
At the 15-minute mark of a class period, click **Trigger Absence Alerts** on the Attendance page. This will evaluate all students in the database. Any student who is still unmarked today is set to `Absent` in the database/CSV log, and an automated Twilio SMS alert is sent to their parent:
> *"Dear Parent, {student_name} was marked absent on {date}. Please contact the school."*
