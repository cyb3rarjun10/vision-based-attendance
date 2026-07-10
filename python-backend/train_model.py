import os
import cv2
import numpy as np
import pickle
import sqlite3
from dotenv import load_dotenv

load_dotenv()

DB_PATH = os.getenv('DB_PATH', '../node-backend/classroom.db')

def get_student_name_from_db(student_id):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM students WHERE id = ?", (student_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row[0]
    except Exception as e:
        print(f"DB read error: {e}")
    return f"Student {student_id}"

def train_model():
    print("Starting training...")
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_dir = os.path.join(base_dir, 'dataset')
    trainer_dir = os.path.join(base_dir, 'trainer')
    
    os.makedirs(trainer_dir, exist_ok=True)
    
    cascade_path = os.path.join(base_dir, 'haarcascade_frontalface_default.xml')
    if not os.path.exists(cascade_path):
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    face_cascade = cv2.CascadeClassifier(cascade_path)
    if face_cascade.empty():
        raise IOError(f"Could not load Haar Cascade from path: {cascade_path}")
        
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    face_samples = []
    labels = []
    label_to_name = {}
    
    if not os.path.exists(dataset_dir):
        return False, "Dataset directory does not exist."
        
    subfolders = [f for f in os.listdir(dataset_dir) if os.path.isdir(os.path.join(dataset_dir, f))]
    if not subfolders:
        return False, "No student folders found."
        
    for folder in subfolders:
        try:
            student_id = int(folder)
        except ValueError:
            continue
            
        student_name = get_student_name_from_db(student_id)
        label_to_name[student_id] = student_name
        folder_path = os.path.join(dataset_dir, folder)
        images = [os.path.join(folder_path, f) for f in os.listdir(folder_path) 
                  if f.lower().endswith(('.png', '.jpg', '.jpeg'))]
        
        for img_path in images:
            img = cv2.imread(img_path)
            if img is None:
                continue
            
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.2, 5, minSize=(30, 30))
            for (x, y, w, h) in faces:
                face_samples.append(gray[y:y+h, x:x+w])
                labels.append(student_id)
                
    if not face_samples:
        return False, "No faces detected in dataset."
        
    recognizer.train(face_samples, np.array(labels))
    recognizer.write(os.path.join(trainer_dir, 'trainer.yml'))
    
    with open(os.path.join(trainer_dir, 'labels.pkl'), 'wb') as f:
        pickle.dump(label_to_name, f)
        
    return True, f"Trained on {len(subfolders)} students ({len(face_samples)} samples)"

if __name__ == '__main__':
    ok, msg = train_model()
    print(msg)
