import os
import cv2
import numpy as np
import pandas as pd
import pickle
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from twilio.rest import Client
from train_model import train_model

load_dotenv()

app = Flask(__name__)
CORS(app)

DB_PATH = os.getenv('DB_PATH', '../node-backend/classroom.db')
CSV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'attendance.csv')

TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID', 'your_sid')
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN', 'your_token')
TWILIO_FROM_NUMBER = os.getenv('TWILIO_FROM_NUMBER', '+1xxxxxxxxxx')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def send_twilio_sms(to_number, message_body):
    print(f"SMS trace: {to_number} -> '{message_body}'")
    
    if (TWILIO_ACCOUNT_SID == 'your_sid' or 
        TWILIO_AUTH_TOKEN == 'your_token' or 
        not TWILIO_ACCOUNT_SID or 
        not TWILIO_AUTH_TOKEN):
        print("Using SMS simulation mode.")
        return True, "SMS Simulated"
        
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=message_body,
            from_=TWILIO_FROM_NUMBER,
            to=to_number
        )
        return True, message.sid
    except Exception as e:
        print(f"SMS error: {e}")
        return False, str(e)

def log_to_csv(student_id, name, status):
    date_str = datetime.now().strftime('%Y-%m-%d')
    time_str = datetime.now().strftime('%H:%M:%S')
    
    rec = {
        'student_id': student_id,
        'name': name,
        'date': date_str,
        'time': time_str,
        'status': status
    }
    df_new = pd.DataFrame([rec])
    
    if os.path.exists(CSV_PATH):
        try:
            df = pd.read_csv(CSV_PATH)
            df = df[~((df['student_id'] == student_id) & (df['date'] == date_str))]
            df = pd.concat([df, df_new], ignore_index=True)
            df.to_csv(CSV_PATH, index=False)
        except Exception:
            df_new.to_csv(CSV_PATH, index=False)
    else:
        df_new.to_csv(CSV_PATH, index=False)

@app.route('/capture-dataset', methods=['POST'])
def capture_dataset():
    student_id = request.args.get('student_id')
    mock = request.args.get('mock', 'false').lower() == 'true'
    
    if not student_id:
        return jsonify({"error": "student_id is required"}), 400
        
    base_dir = os.path.dirname(os.path.abspath(__file__))
    student_dir = os.path.join(base_dir, 'dataset', str(student_id))
    os.makedirs(student_dir, exist_ok=True)
    
    conn = get_db_connection()
    student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    conn.close()
    if not student:
         return jsonify({"error": "Student not found"}), 404
         
    if mock:
        for i in range(1, 31):
            dummy = np.ones((200, 200), dtype=np.uint8) * 128
            cv2.circle(dummy, (100, 100), 70, 255, -1)
            cv2.circle(dummy, (80, 80), 10, 0, -1)
            cv2.circle(dummy, (120, 80), 10, 0, -1)
            cv2.ellipse(dummy, (100, 130), (30, 10), 0, 0, 180, 0, -1)
            cv2.imwrite(os.path.join(student_dir, f"mock_{i}.jpg"), dummy)
        return jsonify({"success": True, "message": f"Captured 30 mock images for {student['name']}"})

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return jsonify({"error": "Could not open camera"}), 400
        
    cascade_path = os.path.join(base_dir, 'haarcascade_frontalface_default.xml')
    if not os.path.exists(cascade_path):
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    count = 0
    max_tries = 300
    tried = 0
    
    while count < 30 and tried < max_tries:
        ret, frame = cap.read()
        if not ret:
            break
        tried += 1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        for (x, y, w, h) in faces:
            count += 1
            face_roi = gray[y:y+h, x:x+w]
            cv2.imwrite(os.path.join(student_dir, f"{count}.jpg"), face_roi)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
            break
        try:
            cv2.imshow("Capture Feed", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        except Exception:
            pass
            
    cap.release()
    try:
        cv2.destroyAllWindows()
    except Exception:
        pass
        
    if count >= 30:
        return jsonify({"success": True, "message": f"Captured {count} frames for {student['name']}."})
    return jsonify({"error": "Face detection failed"}), 400

@app.route('/train', methods=['POST'])
def train():
    try:
        ok, msg = train_model()
        if ok:
            return jsonify({"success": True, "message": msg})
        return jsonify({"error": msg}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/recognize', methods=['POST'])
def recognize():
    mock = request.args.get('mock', 'false').lower() == 'true'
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'trainer', 'trainer.yml')
    labels_path = os.path.join(base_dir, 'trainer', 'labels.pkl')
    
    if not os.path.exists(model_path) or not os.path.exists(labels_path):
        return jsonify({"error": "Model not trained yet"}), 400
        
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(model_path)
    with open(labels_path, 'rb') as f:
        label_map = pickle.load(f)
        
    if mock:
        conn = get_db_connection()
        students = conn.execute("SELECT id, name FROM students").fetchall()
        conn.close()
        if not students:
            return jsonify({"error": "No students found"}), 400
        ids = [s['id'] for s in students if s['id'] in label_map]
        if not ids:
             return jsonify({"error": "No trained students found"}), 400
        import random
        rec_id = random.choice(ids)
        conf = float(random.randint(15, 45))
        return jsonify({
            "success": True,
            "student_id": rec_id,
            "name": label_map[rec_id],
            "confidence": conf
        })
        
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        return jsonify({"error": "Camera not found"}), 400
        
    cascade_path = os.path.join(base_dir, 'haarcascade_frontalface_default.xml')
    if not os.path.exists(cascade_path):
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    
    rec_id = None
    confidence = 999.0
    frames = 150
    count = 0
    
    while count < frames:
        ret, frame = cap.read()
        if not ret:
            break
        count += 1
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        for (x, y, w, h) in faces:
            face_roi = gray[y:y+h, x:x+w]
            label, conf = recognizer.predict(face_roi)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            if conf < 80 and label in label_map:
                rec_id = label
                confidence = conf
                break
        try:
            cv2.imshow("Scanning Feed", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
        except Exception:
            pass
        if rec_id is not None:
            break
            
    cap.release()
    try:
        cv2.destroyAllWindows()
    except Exception:
        pass
        
    if rec_id is not None:
        return jsonify({
            "success": True,
            "student_id": rec_id,
            "name": label_map[rec_id],
            "confidence": float(confidence)
        })
    return jsonify({"error": "Face not recognized"}), 404

@app.route('/mark-attendance', methods=['POST'])
def mark_attendance():
    data = request.get_json(silent=True) or {}
    student_id = data.get('student_id') or request.args.get('student_id')
    if not student_id:
        return jsonify({"error": "student_id is required"}), 400
        
    try:
        student_id = int(student_id)
        date_str = datetime.now().strftime('%Y-%m-%d')
        conn = get_db_connection()
        student = conn.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
        
        if not student:
            conn.close()
            return jsonify({"error": "Student not found"}), 404
            
        prev = conn.execute(
            "SELECT status FROM attendance WHERE student_id = ? AND date = ?", 
            (student_id, date_str)
        ).fetchone()
        
        was_absent = prev and prev['status'] == 'Absent'
            
        conn.execute("""
            INSERT INTO attendance (student_id, date, status)
            VALUES (?, ?, 'Present')
            ON CONFLICT(student_id, date) 
            DO UPDATE SET status = 'Present'
        """, (student_id, date_str))
        conn.commit()
        conn.close()
        
        log_to_csv(student_id, student['name'], 'Present')
        
        sms_sent = False
        sms_sid = None
        if was_absent:
            phone = student['parent_phone']
            msg = f"Dear Parent, {student['name']} arrived late and was marked present on {date_str}."
            success, sid = send_twilio_sms(phone, msg)
            sms_sent = success
            sms_sid = sid
            
        return jsonify({
            "success": True,
            "message": f"Marked {student['name']} present.",
            "was_previously_absent": was_absent,
            "sms_sent": sms_sent,
            "sms_sid": sms_sid
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/trigger-absent-alerts', methods=['POST'])
def trigger_absent_alerts():
    try:
        date_str = datetime.now().strftime('%Y-%m-%d')
        conn = get_db_connection()
        students = conn.execute("SELECT * FROM students").fetchall()
        alerted = []
        
        for student in students:
            sid = student['id']
            record = conn.execute(
                "SELECT * FROM attendance WHERE student_id = ? AND date = ?",
                (sid, date_str)
            ).fetchone()
            
            if not record:
                conn.execute("INSERT INTO attendance (student_id, date, status) VALUES (?, ?, 'Absent')", (sid, date_str))
                conn.commit()
                log_to_csv(sid, student['name'], 'Absent')
                
                phone = student['parent_phone']
                msg = f"Dear Parent, {student['name']} was marked absent on {date_str}. Please contact the school."
                success, sms_id = send_twilio_sms(phone, msg)
                alerted.append({
                    "id": sid,
                    "name": student['name'],
                    "parent_phone": phone,
                    "sms_status": "sent" if success else "failed",
                    "sms_sid": sms_id
                })
        conn.close()
        return jsonify({
            "success": True,
            "message": f"Processed {len(alerted)} absences.",
            "alerted_students": alerted
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
