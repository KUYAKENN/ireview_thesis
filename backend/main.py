from datetime import datetime
import bcrypt
from flask import Flask, request, jsonify,send_from_directory, redirect, url_for
import fitz  # PyMuPDF
from flask_cors import CORS  # Import CORS
import google.generativeai as genai
from flask_mysqldb import MySQL
import os
import uuid
import json
import re
import spacy
import nltk
import pymupdf4llm
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize
from spacy import displacy
from nltk.probability import FreqDist
from nltk.tokenize.treebank import TreebankWordDetokenizer
import networkx as nx
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import time
import subprocess
from dotenv import load_dotenv
from flask_mail import Mail, Message
import random
import string

load_dotenv()


app = Flask(__name__)

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] =  os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')

mysql = MySQL(app)

CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "User-ID"]
    }
})
genai.configure(api_key="AIzaSyDR1Lxpk_tpQetj6LdaiMOWD_xEvl873W0")
model = genai.GenerativeModel("gemini-1.5-flash")

# Initialize SpaCy model
nlp = spacy.load("en_core_web_sm")

# Download required NLTK resources
nltk.download('punkt_tab')
nltk.download('stopwords')

tasks = {}


def preprocessMarkdown(text):
    # Remove Markdown formatting using regex
    # Remove headers (e.g., #, ##, ### etc.)
    text = re.sub(r'^[#]+ .+', '', text, flags=re.MULTILINE)

    # Remove other Markdown syntax like bold, italics, etc.
    text = re.sub(r'(\*\*|\*|__|_)(.*?)\1', r'\2', text)  # Remove bold and italics
    text = re.sub(r'`(.*?)`', r'\1', text)  # Remove inline code
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Remove links
    text = re.sub(r'\s+', ' ', text).strip()
    # sentences = nltk.sent_tokenize(text)
    # unique_sentences = remove_redundancy(sentences)
    # summary = ''.join([sentence for sentence in unique_sentences])
    # return summary
    return text

def sentence_to_vector(sentence):
    """Convert a sentence into a vector representation using spaCy"""
    doc = nlp(sentence)
    return doc.vector

def remove_redundancy(sentences, threshold=0.8):
    """Remove redundant sentences based on cosine similarity"""
    unique_sentences = []
    sentence_vectors = []
    
    for sentence in sentences:
        vector = sentence_to_vector(sentence)
        
        # Reshape the vector to be 2D (1, n) for similarity calculation
        vector_reshaped = vector.reshape(1, -1)
        
        # Calculate similarity with previously stored sentence vectors
        if sentence_vectors:
            similarities = cosine_similarity(vector_reshaped, sentence_vectors)
        
            # If the sentence is similar to any existing sentence, skip it
            if similarities.max() < threshold:
                unique_sentences.append(sentence)
                sentence_vectors.append(vector)
        else:
            # If sentence_vectors is empty, this is the first sentence
            unique_sentences.append(sentence)
            sentence_vectors.append(vector)
    
    return unique_sentences


# Step 1: Basic Text Cleaning (remove punctuation, special characters, etc.)
def clean_text(text):
    text = re.sub(r'\s+', ' ', text)  # Remove extra spaces
    # text = re.sub(r'[^a-zA-Z0-9\s,.!?]', '', text)  # Keep only letters, numbers, and some punctuation
    text = text.lower().strip()  # Convert to lowercase and remove leading/trailing spaces
    return text

def split_text_by_lines(text, max_lines):
    """
    Splits a large text into chunks, each containing a specified number of lines.
    
    Args:
    text (str): The large text to be split.
    max_lines (int): The maximum number of lines per chunk.
    
    Returns:
    list: A list of text chunks, each containing up to max_lines lines.
    """
    # Split the text into lines
    lines = text.splitlines()
    
    # Create chunks by grouping lines up to max_lines per chunk
    return [lines[i:i+max_lines] for i in range(0, len(lines), max_lines)]

# Step 2: Remove Stopwords
def remove_stopwords(text):
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(text)
    filtered_words = [word for word in words if word not in stop_words]
    return ' '.join(filtered_words)

# Step 3: Named Entity Recognition (NER)
def extract_named_entities(text):
    doc = nlp(text)
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    return entities

# Step 4: Frequency Distribution (to extract the most common terms)
def get_frequent_terms(text, num_terms=30):
    words = word_tokenize(text)
    fdist = FreqDist(words)
    return fdist.most_common(num_terms)

# Step 5: Part-of-Speech (POS) Tagging
def pos_tagging(text):
    doc = nlp(text)
    pos_tags = [(token.text, token.pos_) for token in doc]
    return pos_tags

# Step 6: Text Summarization (Extractive Summarization with NLTK)
def summarize_text(text, num_sentences=3):
    sentences = sent_tokenize(text)
    # Rank sentences by frequency of important words
    word_freq = FreqDist(word_tokenize(text.lower()))
    important_sentences = sorted(sentences, key=lambda s: sum(word_freq[word] for word in word_tokenize(s.lower())), reverse=True)
    return ' '.join(important_sentences[:num_sentences])

# Main Preprocessing Function: Combine all steps
def preprocess_text(text):
    # Step 1: Clean text
    cleaned_text = clean_text(text)

    # Step 3: Remove stopwords
    cleaned_text_no_stopwords = remove_stopwords(cleaned_text)

    # Step 4: Extract named entities
    entities = extract_named_entities(cleaned_text)

    # Step 5: Get frequent terms
    frequent_terms = get_frequent_terms(cleaned_text_no_stopwords)

    # Step 6: Part-of-speech tagging
    pos_tags = pos_tagging(cleaned_text)

    # Step 7: Summarize the text (Optional)
    summarized_text = summarize_text(cleaned_text_no_stopwords)

    # Return a dictionary with various processed outputs
    return {
        "cleaned_text": cleaned_text,
        "summarized_text": summarized_text,
        "entities": entities,
        "frequent_terms": frequent_terms,
        "pos_tags": pos_tags
    }


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization, User-ID')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        cursor = mysql.connection.cursor()
        cursor.execute('SELECT * FROM user_profile WHERE email = %s', (email,))
        user = cursor.fetchone()
        cursor.close()

        if user and bcrypt.checkpw(password.encode('utf-8'), user[4].encode('utf-8')):
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': user[0],
                    'firstName': user[1],
                    'lastName': user[2],
                    'email': user[3],
                    'profilePictureUrl': user[5],
                    'created_at': user[6],
                    'updated_at': user[7]
                }
            }), 200
        else:
            return jsonify({'message': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500



@app.route('/api/profile/<user_id>', methods=['PUT'])
def update_profile(user_id):
    try:
        data = request.get_json()
        first_name = data.get('firstName')
        last_name = data.get('lastName')

        if not first_name or not last_name:
            return jsonify({'message': 'Missing required fields'}), 400

        cursor = mysql.connection.cursor()
        cursor.execute('''
            UPDATE user_profile 
            SET first_name = %s, last_name = %s, updated_at = NOW()
            WHERE id = %s
        ''', (first_name, last_name, user_id))

        mysql.connection.commit()
        cursor.close()

        return jsonify({'message': 'Profile updated successfully'}), 200

    except Exception as e:
        print(str(e))
        return jsonify({'message': 'Profile update failed', 'error': str(e)}), 500
    
user_reset_codes = {}

# Setup Flask-Mail
app.config['MAIL_SERVER'] =  os.getenv('MAIL_SERVER')  # Your SMTP server
app.config['MAIL_PORT'] =   os.getenv('MAIL_PORT')   # SMTP port
app.config['MAIL_USE_TLS'] = True  # Use TLS
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] =  os.getenv('MAIL_USERNAME')  # Your email
app.config['MAIL_PASSWORD'] =  os.getenv('MAIL_PASSWORD')   # Your email password
app.config['MAIL_DEFAULT_SENDER'] =  os.getenv('MAIL_DEFAULT_SENDER')  # Default sender
mail = Mail(app)

def generate_reset_code():
    """Generate a random reset code."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

@app.route('/api/profile/<email>/reset-password', methods=['PUT'])
def reset_password(email):
    """Send an email to the user with the password reset link."""
    # Generate a unique reset code
    reset_code = generate_reset_code()

    # Store the reset code against the user's email (in-memory for demo purposes)
    user_reset_codes[email] = reset_code

    # Get the current origin (scheme + domain + port)
    origin = os.getenv('HOST_URL')  # This gives you the scheme and domain (including port if not 80/443)
    
    # Create the reset URL with the current origin
    reset_url = f'{origin}api/profile/{reset_code}/verify'

    # Compose the email content
    subject = "Password Reset Request"
    body = f"""
    Hello,

    To reset your password, please click on the following link:

    {reset_url}

    Your new password will be: {reset_code}

    If you did not request this password reset, please ignore this email.

    Regards,
    Your App Team
    """

    # Send the email
    msg = Message(subject, recipients=[email], body=body)
    try:
        mail.send(msg)
        return jsonify({"message": "Password reset email sent."}), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": f"Failed to send email: {str(e)}"}), 500

@app.route('/api/profile/<code>/verify', methods=['GET'])
def verify_reset_code(code):
    """Verify the reset code from the URL and allow the user to change their password."""
    # Check if the code exists in the dictionary (or your database)
    user_email = None
    for email, stored_code in user_reset_codes.items():
        if stored_code == code:
            user_email = email
            break

    if not user_email:
        return jsonify({"error": "Invalid reset code"}), 400

    try:
        reset_to_new_password(user_email, code)
        del user_reset_codes[email]
        return  f"Reset code verified for {user_email}. Please proceed to login page and type your new password."
    except:
        return  f"This account does not exists in iReview"
        


# Profile picture upload endpoint
@app.route('/api/profile/<user_id>/picture', methods=['POST'])
def upload_profile_picture(user_id):
    try:
        if 'profile_picture' not in request.files:
            print('No file provided')
            return jsonify({'message': 'No file provided'}), 400
            
        file = request.files['profile_picture']
        allowed_file(file.filename)
        if file.filename == '':
            print('No file selected')
            return jsonify({'message': 'No file selected'}), 400
        if file and allowed_profile_file(file.filename):
            # Generate unique filename
            file_extension = file.filename.rsplit('.', 1)[1].lower()
            filename = f"profile_{user_id}.{file_extension}"
            filepath = os.path.join(UPLOAD_FOLDER+ '/profiles', filename)
            
            # Save file
            file.save(filepath)
            
            # Update database with new profile picture URL
            cursor = mysql.connection.cursor()
            cursor.execute('''
                UPDATE user_profile 
                SET profile_picture = %s,
                    updated_at = %s
                WHERE id = %s
            ''', (filename, datetime.now(), user_id))
            
            mysql.connection.commit()
            
            # Fetch updated user data
            cursor.execute('''
                SELECT id, email, first_name, last_name, profile_picture
                FROM user_profile 
                WHERE id = %s
            ''', (user_id,))
            
            user = cursor.fetchone()
            cursor.close()
            
            if user:
                return jsonify({
                    'message': 'Profile picture updated successfully',
                    'profilePictureUrl': filename,
                    'user': {
                        'id': user[0],
                        'email': user[1],
                        'firstName': user[2],
                        'lastName': user[3],
                        'profilePictureUrl': user[4]
                    }
                }), 200
            else:
                print('User not found')
                return jsonify({'message': 'User not found'}), 404
        else:
            
            print(f"Invalid file type")
            return jsonify({'message': 'Invalid file type'}), 400
        
    except Exception as e:
        print(f"Error uploading profile picture: {str(e)}")
        return jsonify({'message': 'Profile picture upload failed'}), 500

# Helper function to check allowed file types
def allowed_profile_file(filename):
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    file_extension = filename.rsplit('.', 1)[1].lower() 
    return file_extension in ALLOWED_EXTENSIONS

@app.route('/api/profile/<int:user_id>/password', methods=['PUT'])
def update_password(user_id):
    try:
        data = request.get_json()
        current_password = data.get('currentPassword')
        new_password = data.get('newPassword')

        cursor = mysql.connection.cursor()
        cursor.execute('SELECT password FROM user_profile WHERE id = %s', (user_id,))
        user = cursor.fetchone()

        if not user:
            return jsonify({'message': 'User not found'}), 404

        stored_password = user[0]

        if not bcrypt.checkpw(current_password.encode('utf-8'), stored_password.encode('utf-8')):
            return jsonify({'message': 'Current password is incorrect'}), 401

        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        cursor.execute('UPDATE user_profile SET password = %s, updated_at = NOW() WHERE id = %s',
                       (hashed_password, user_id))
        mysql.connection.commit()
        cursor.close()

        return jsonify({'message': 'Password updated successfully'}), 200

    except Exception as e:
        return jsonify({'message': 'Failed to update password', 'error': str(e)}), 500

@app.route('/api/reviewers', methods=['POST'])
def create_reviewer():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    data = request.get_json()
    docId = data.get('docId')
    docTitle = data.get('docTitle')
    docUrl = data.get('docUrl')
    size = data.get('size')
    modified_date = data.get('modifiedDate')
    tags = data.get('tags')

    cursor = mysql.connection.cursor()
    cursor.execute('''INSERT INTO reviewers (docId,docTitle, docUrl, size, modifiedDate, tags, user_id) 
                      VALUES (%s, %s, %s, %s, %s, %s, %s)''', 
                   (docId,docTitle, docUrl, size, modified_date, tags, user_id))
    mysql.connection.commit()
    cursor.close()
    
    return jsonify({'message': 'Reviwer created successfully'}), 201

@app.route('/api/quiz-attempts', methods=['POST'])
def create_quiz_attempt():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    
    data = request.get_json()
    quiz_ids = data.get('quiz_ids')  # Expecting an array of quiz IDs
    score = data.get('score')
    start_time = data.get('start_time')
    end_time = data.get('end_time')
    totalQuestions = data.get('totalQuestions')

    # Insert the quiz attempt record
    cursor = mysql.connection.cursor()
    cursor.execute('''INSERT INTO quiz_attempts (score, totalQuestions, start_time, end_time, user_id) 
                      VALUES (%s, %s, %s, %s, %s)''', 
                   (score, totalQuestions, start_time, end_time, user_id))
    mysql.connection.commit()
    
    # Get the ID of the newly created quiz attempt
    quiz_attempt_id = cursor.lastrowid
    
    # Insert records into the quiz_attempt_quizzes table for each quiz
    for quiz_id in quiz_ids:
        cursor.execute('''INSERT INTO selected_quizzes (quiz_attempt_id, quiz_id) 
                          VALUES (%s, %s)''', 
                       (quiz_attempt_id, quiz_id))
    
    mysql.connection.commit()
    cursor.close()
    
    return jsonify({'message': 'Quiz attempt created successfully'}), 201



@app.route('/api/documents', methods=['POST'])
def create_document():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    data = request.get_json()
    id = data.get('id')
    title = data.get('title')
    doc_type = data.get('type')
    size = data.get('size')
    modified_date = data.get('modifiedDate')
    tags = data.get('tags')
    url = data.get('url')

    cursor = mysql.connection.cursor()
    cursor.execute('''INSERT INTO documents (id,title, type, size, modifiedDate, tags, url, user_id) 
                      VALUES (%s, %s, %s, %s, %s, %s, %s, %s)''', 
                   (id,title, doc_type, size, modified_date, tags, url,user_id))
    mysql.connection.commit()
    cursor.close()
    
    return jsonify({'message': 'Document created successfully'}), 201

@app.route('/api/reviewers', methods=['GET'])
def get_reviewers():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM reviewers WHERE user_id = %s', (user_id) )
    documents = cursor.fetchall()
    cursor.close()

    documents_list = []
    for doc in documents:
        document = {
            'docId': doc[0],
            'docTitle': doc[1],
            'docUrl': doc[2],
            'size': doc[3],
            'modifiedDate': doc[4],
            'createdAt': [doc[5]],
            'tags': [doc[6]]
        }
        documents_list.append(document)

    return jsonify({'reviewers': documents_list}), 200

@app.route('/api/quizzes', methods=['GET'])
def get_quizzes():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()
    
    # Fetch quizzes
    cursor.execute('SELECT * FROM quizzes WHERE user_id = %s', (user_id))
    quizzes = cursor.fetchall()
    
    # List to store the final quiz data
    quizzes_list = []
    
    for quiz in quizzes:
        quiz_id = quiz[0]
        quiz_title = quiz[2]
        time_limit = quiz[3]
        category = quiz[4]
        total_questions = quiz[5]
        date_created = quiz[6]
        last_modified = quiz[7]
        
        # Fetch questions related to the current quiz
        cursor.execute('SELECT * FROM quiz_items WHERE quiz_id = %s', (quiz_id,))
        quiz_items = cursor.fetchall()
        
        questions_list = []
        
        for item in quiz_items:
            question = {
                'id': item[0],  # Assuming 'id' is the primary key for quiz items
                'text': item[2],  # Assuming 'question' is in the 3rd column
                'options': json.loads(item[3]),  # 'options' is stored as JSON, so we need to load it
                'correctAnswer': item[4],  # 'correctIndex' column in the 'quiz_items' table
                'explanation': item[5]  # Assuming 'explanation' is in the 6th column
            }
            questions_list.append(question)
        
        # Create the quiz data structure
        quiz_data = {
            'id': quiz_id,
            'docTitle': quiz_title,
            'questions': questions_list,
            'timeLimit': time_limit,
            'category': category,
            'totalQuestions': total_questions,
            'dateCreated': date_created.isoformat(),  # Format date as ISO string
            'lastModified': last_modified.isoformat()  # Format date as ISO string
        }
        
        quizzes_list.append(quiz_data)
    
    cursor.close()
    
    return jsonify(quizzes_list), 200

@app.route('/api/quiz-attempts', methods=['GET'])
def get_quiz_attempts():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()
    
    # Fetch quizzes
    cursor.execute('SELECT * FROM quiz_attempts WHERE user_id = %s ORDER BY start_time', (user_id))
    attempts = cursor.fetchall()
    
    # List to store the final quiz data
    attempts_list = []
    
    for item in attempts:
        id = item[0]
        score = item[1]
        totalQuestions = item[2]
        start_time = item[3]
        end_time = item[4]

        cursor.execute('SELECT * FROM selected_quizzes WHERE quiz_attempt_id = %s', (id,))
        quizzes = cursor.fetchall()

        
        # Create the quiz data structure
        attempt_data = {
            'quiz_ids': [quiz[2] for quiz in quizzes] ,
            'id': id,
            'score': score,
            'totalQuestions': totalQuestions,
            'start_time': start_time,
            'end_time': end_time,
        }
        
        attempts_list.append(attempt_data)
    
    cursor.close()
    
    return jsonify(attempts_list), 200



@app.route('/api/flashcards', methods=['GET'])
def get_flashcards():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()
    
    # Fetch flashcards
    cursor.execute('SELECT * FROM flashcards WHERE user_id = %s', (user_id))
    flashcards = cursor.fetchall()
    
    # List to store the final flashcard data
    flashcards_list = []
    
    for flashcard in flashcards:
        flashcard_id = flashcard[0]
        doc_id = flashcard[1]
        doc_title = flashcard[2]
        date_created = flashcard[3]
        
        # Fetch flashcard items related to the current flashcard
        cursor.execute('SELECT * FROM flashcard_items WHERE flashcard_id = %s', (flashcard_id,))
        flashcard_items = cursor.fetchall()
        
        items_list = []
        
        for item in flashcard_items:
            flashcard_item = {
                'id': item[0],  # Assuming 'id' is the primary key for flashcard items
                'front': item[2],  
                'back': item[3]
            }
            items_list.append(flashcard_item)
        
        # Create the flashcard data structure
        flashcard_data = {
            'id': flashcard_id,
            'docId': doc_id,
            'docTitle': doc_title,
            'dateCreated': date_created.isoformat(),  # Format date as ISO string
            'items': items_list  # Attach related flashcard items
        }
        
        flashcards_list.append(flashcard_data)
    
    cursor.close()
    
    return jsonify(flashcards_list), 200

# for registration
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['firstName', 'lastName', 'email', 'password']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'Missing required fields'}), 400

        first_name = data['firstName']
        last_name = data['lastName']
        email = data['email']
        password = data['password']
        profile_picture_url = data.get('profilePictureUrl')  # Optional field

        cursor = mysql.connection.cursor()
        
        # Check if email already exists
        cursor.execute('SELECT id FROM user_profile WHERE email = %s', (email,))
        if cursor.fetchone():
            cursor.close()
            return jsonify({'message': 'Email already exists'}), 400

        # Hash password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert new user with profile picture URL if provided
        if profile_picture_url:
            cursor.execute(
                'INSERT INTO user_profile (first_name, last_name, email, password, profile_picture) VALUES (%s, %s, %s, %s, %s)',
                (first_name, last_name, email, hashed_password, profile_picture_url)
            )
        else:
            cursor.execute(
                'INSERT INTO user_profile (first_name, last_name, email, password) VALUES (%s, %s, %s, %s)',
                (first_name, last_name, email, hashed_password)
            )
            
        mysql.connection.commit()
        cursor.close()

        return jsonify({'message': 'Registration successful'}), 201

    except Exception as e:
        # Log the error server-side
        print(f"Registration error: {str(e)}")
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500

def reset_to_new_password(email, new_password):
    """Update the password for an existing user"""
    cursor = mysql.connection.cursor()
    
    # Check if the email exists
    cursor.execute('SELECT * FROM user_profile WHERE email = %s', (email,))
    user = cursor.fetchone()
    
    if not user:
       raise 'Error'
    
    # Hash the new password
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    
    # Update the password for the user in the database
    cursor.execute(
        'UPDATE user_profile SET password = %s WHERE email = %s',
        (hashed_password, email)
    )
    
    # Commit the changes
    mysql.connection.commit()
    cursor.close()
    
    print("Password updated successfully.")
@app.route('/api/documents', methods=['GET'])
def get_documents():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM documents WHERE user_id = %s', (user_id))
    documents = cursor.fetchall()
    cursor.close()

    documents_list = []
    for doc in documents:
        document = {
            'id': doc[0],
            'title': doc[1],
            'type': doc[2],
            'size': doc[3],
            'modifiedDate': doc[4],
            'tags': [doc[5]],
            'url': doc[6]
        }
        documents_list.append(document)

    return jsonify({'documents': documents_list}), 200


@app.route('/api/documents/<doc_id>', methods=['GET'])
def get_document(doc_id):
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM documents WHERE id=%s AND user_ud = %s', (doc_id, user_id))
    document = cursor.fetchone()
    cursor.close()

    if document:
        document_data = {
            'id': document[0],
            'title': document[1],
            'type': document[2],
            'size': document[3],
            'modifiedDate': document[4],
            'tags': document[5],
            'url': document[6]
        }
        return jsonify({'document': document_data}), 200
    else:
        return jsonify({'message': 'Document not found'}), 404


@app.route('/api/documents/<doc_id>', methods=['PUT'])
def update_document(doc_id):
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    data = request.get_json()
    title = data.get('title')
    doc_type = data.get('type')
    size = data.get('size')
    modified_date = data.get('modifiedDate')
    tags = data.get('tags')
    url = data.get('url')

    cursor = mysql.connection.cursor()
    cursor.execute('''UPDATE documents SET title=%s, type=%s, size=%s, 
                      modifiedDate=%s, tags=%s, url=%s WHERE id=%s AND user_id=%s''', 
                   (title, doc_type, size, modified_date, tags, url, doc_id, user_id))
    mysql.connection.commit()
    cursor.close()

    return jsonify({'message': 'Document updated successfully'}), 200



@app.route('/api/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()

    # Fetch the document before deleting it
    cursor.execute('SELECT * FROM documents WHERE id=%s AND user_id = %s', (doc_id, user_id))
    document = cursor.fetchone()

    if doc_id in tasks:
        del tasks[doc_id]

    if not document:
        return jsonify({'message': 'Document not found'}), 404

    # Delete the document
    cursor.execute('DELETE FROM documents WHERE id=%s', (doc_id,))
    mysql.connection.commit()
    cursor.close()

    # Adjust this based on your actual database field
    file_path = os.path.join(UPLOAD_FOLDER, document[6])
    # Delete the file from the uploads folder
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        else:
            pass
    except Exception as e:
        pass

    return jsonify({'message': 'Document deleted successfully'}), 200

@app.route('/api/materials/<doc_id>', methods=['DELETE'])
def delete_materials(doc_id):
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()


    # Delete the document
    cursor.execute('DELETE FROM quizzes WHERE docId=%s AND user_id = %s', (doc_id, user_id))
    cursor.execute('DELETE FROM flashcards WHERE docId=%s AND user_id =%s', (doc_id, user_id))
    mysql.connection.commit()
    cursor.close()


    return jsonify({'message': 'Document deleted successfully'}), 200

@app.route('/api/reviewers/<doc_id>', methods=['DELETE'])
def delete_reviewer(doc_id):
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    cursor = mysql.connection.cursor()

    # Fetch the document before deleting it
    cursor.execute('SELECT * FROM reviewers WHERE docId=%s AND user_id = %s', (doc_id,user_id))
    document = cursor.fetchone()

    if not document:
        return jsonify({'message': 'Reviwer not found'}), 404
    
    if doc_id in tasks:
        del tasks[doc_id]


    # Delete the document
    cursor.execute('DELETE FROM reviewers WHERE docId=%s', (doc_id,))
    mysql.connection.commit()
    cursor.close()

    # Adjust this based on your actual database field
    file_path = os.path.join(UPLOAD_FOLDER, document[2])
    # Delete the file from the uploads folder
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        else:
            pass
    except Exception as e:
        pass

    return jsonify({'message': 'Reviwer deleted successfully'}), 200


UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'pptx'}
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER + '/profiles', exist_ok=True)

def allowed_file(filename):
    # Check if the file has an allowed extension
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_file():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    
    # Check if a file is provided in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file and allowed_file(file.filename):
        try:
            # Create a unique file name
            file_id = str(uuid.uuid4())
            file_extension = file.filename.rsplit('.', 1)[1].lower()  # Get the file extension
            file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.{file_extension}")

            # Save the file to the server
            file.save(file_path)

            # Convert the file to PDF if it's .docx or .pptx
            if file_extension in ['docx', 'pptx']:
                converted_file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.pdf")
                # Use LibreOffice to convert the file to PDF
                conversion_command = [
                    'soffice', '--headless', '--convert-to', 'pdf', '--outdir',   UPLOAD_FOLDER, file_path                ]
    
                subprocess.run(conversion_command, check=True)
                
                # After conversion, remove the original file
                os.remove(file_path)
                file_path = converted_file_path  # Update file path to the new PDF

            # Return the file path or file ID for future processing
            return jsonify({"file_id": file_id, 'ext': 'pdf'}), 200
        
        except subprocess.CalledProcessError as e:
            print(str(e))
            return jsonify({"error": f"Error during file conversion: {str(e)}"}), 500
        except Exception as e:
            print(str(e))
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Invalid file format. Please upload a PDF, DOCX, or PPTX."}), 400
    
@app.route('/uploads/<path:filename>', methods=['GET'])
def get_uploaded_file(filename):
    # user_id = request.headers.get('User-ID')
    # if not user_id:
    #     return jsonify({"error": "User is unauthorized"}), 400
    # Serve the file from the UPLOAD_FOLDER
    try:
        return send_from_directory(UPLOAD_FOLDER, filename)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404
    
@app.route('/api/pending-reviewer', methods=['POST','PUT'])
def pending_reviewer():
    user_id = request.headers.get('User-ID')
    print(tasks)
    
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 404
    data = request.get_json()
    file_id = data.get('file_id')
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM documents WHERE id=%s AND user_id = %s', (file_id,user_id))
    documents = cursor.fetchall()
    
    if len(documents) <= 0:
        return jsonify({"error": "Invalid file ID provided"}), 404
    # Extract the file_id from the request
    print(file_id)
    if file_id not in tasks:
        return jsonify({"error": "File not found in tasks"}), 404 
    if request.method == 'PUT':
        return jsonify({"status": ' '.join(["Your reviewer for", documents[0][1], "is pending..." ])}), 200

    # Check if the file is still processing and wait for it to be removed
    while  file_id  in tasks and tasks[file_id] is True:
        time.sleep(1)  # Wait for 1 second before checking again

    if(file_id in tasks):
         del tasks[file_id]
    return jsonify({"message": ' '.join(["Your reviewer for", documents[0][1], "is ready!" ])}), 200
        
    # Once file is removed or task is no longer "Processing"
@app.route('/api/generate-reviewer', methods=['POST'])
def generate_review():
    import time
    from datetime import datetime
    
    start_time = time.time()
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    # Extract the file_id from the request
    data = request.get_json()
    file_id = data.get('file_id')
    
    if not file_id:
        return jsonify({"error": "No file ID provided"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}.pdf")

    # Check if the file exists
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        # print('Processing....')
        # tasks[file_id] = True
        # if file_id in tasks:
        #     print('In task!')
        # print(tasks)
        # # Open the PDF with PyMuPDF
        # doc = fitz.open(file_path)

        # # Variable to store the final compiled review
        all_text = ''    
    
        page_text = pymupdf4llm.to_markdown(file_path) 
        page_text = preprocessMarkdown(page_text) 
        chunks  = split_text_by_lines(page_text, 500) 
        # page_text = clean_text(page_text)

        for i, chunk in enumerate(chunks):
            print(f"Processing chunk {i}")
            review_input = f"""
                Create a comprehensive educational reviewer strictly based on the following course material.

                TEXT TO ANALYZE: {chunk}

                Your task:
                1. Create a structured reviewer with:
                - A clear title and introduction summarizing the main topic
                - Well-organized sections with numbered headings if applicable if not then proceed with just the title
                - Key terms highlighted in blue
                - Comparative tables where appropriate
                - Code examples or pseudocode ONLY if they appear in the original text
                - If there are examples add it 
                - Key takeaways section based ONLY on information present in the original
                - Further study suggestions mentioned in the original document
                - 2-3 practice questions related to the content

                2. IMPORTANT GUIDELINES:
                - Include ONLY information that is explicitly stated in the original document
                - Do not add any new concepts, definitions, or explanations not present in the source
                - Do not make assumptions or draw conclusions beyond what is stated
                - Maintain the same terminology as used in the original document
                - Present the information in the same order as it appears in the source
                - If information seems incomplete, do not attempt to complete it
                - For code or algorithms, use EXACTLY the same implementations shown in the original

                3. Format the output as clean HTML with:
                - Consistent styling using CSS
                - Black text as default with blue for key terms
                - Bold for section headings
                - Properly formatted tables for tabular information from the original

                4. End the reviewer with this exact disclaimer (add 2 spaces and it should be on italic and red color):
                "Note: This iReview focuses on generating text-based summaries from the original document. Figures, images, and visual elements from the original document are not included in this reviewer."

                The reviewer should be a faithful representation of the original document in a more structured and highlighted format.
                """
            page_review = model.generate_content(review_input)
            all_text += f"\n{page_review.text}"
        all_text = page_review.text
        
        # Calculate elapsed time
        end_time = time.time()
        elapsed_time = end_time - start_time
        minutes, seconds = divmod(elapsed_time, 60)
        seconds_int = int(seconds)
        milliseconds = int((seconds - seconds_int) * 1000)
        
        # Get current timestamp with milliseconds
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
        
        # Print completion message with timing information including milliseconds
        print(f'Completed at {current_time}')
        print(f'Time taken: {int(minutes)} minutes, {seconds_int} seconds and {milliseconds} milliseconds')
        
        # Return the final compiled review
        return jsonify({"compiled_review": all_text.replace("```html", "").replace("```", "").replace("\n", "")}), 200

    except Exception as e:
        # tasks[file_id] = False
        print(e)
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/generate-flashcards', methods=['POST'])
def generate_flashcards():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    # Extract the file_id from the request
    data = request.get_json()
    file_id = data.get('file_id')
    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM reviewers WHERE docUrl=%s AND user_id = %s', (file_id,user_id))
    documents = cursor.fetchall()
    
    if len(documents) <= 0:
        return jsonify({"error": "No file ID provided"}), 400
    
    if not file_id:
        return jsonify({"error": "No file ID provided"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}")

    # Check if the file exists
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        print('Processing....')

        # Open the PDF with PyMuPDF
        doc = fitz.open(file_path)
        total_flashcards = 30
        total_pages = len(doc)

        # Determine how many quiz items to generate per page
        items_per_page = total_flashcards // total_pages
        extra_items = total_flashcards % total_pages
        flashcards = []
        # Process each page, extract text, generate flashcards
        for i, page in enumerate(doc):
            print(f"Processing page {i+1}")
            page_text = page.get_text("text")  # Extract text from the current page
            flashcards_for_page = items_per_page + (1 if i < extra_items else 0)
            flashcard_input = f"This is page {i+1}, summarize the key concepts into {flashcards_for_page} flashcards with  (front) and  (back), format as a list of JSON flashcard object with keywords on front field and definitions on back field. Text: {page_text}"

            flashcard_content = model.generate_content(flashcard_input)  # Assuming model is defined elsewhere
            # Process the flashcard content and format it as a list of questions and answers
            flashcard_data = flashcard_content.text.replace("```json", "").replace("```", "").replace("\n", "")
            print(flashcard_data)
            try:
                flashcards_json = json.loads(flashcard_data)
                

                # Insert flashcard items
                for card in flashcards_json:
                    flashcards.append({
                        "front": card.get('front', '').strip(),
                        "back": card.get('back', '').strip()
                    })

                mysql.connection.commit()  # Commit the transaction
                print(f"Flashcards stored for page {i+1}")
                
            except json.JSONDecodeError:
                continue

        # Insert a new entry into the 'flashcards' table
        doc_title = f"{documents[0][1]} Flashcards"  # Or retrieve title from somewhere else
        date_created = datetime.now()
        cursor.execute(
            "INSERT INTO flashcards (docId, docTitle, dateCreated, user_id) VALUES (%s, %s, %s, %s)",
            (documents[0][0], doc_title, date_created, user_id)
        )
        flashcard_id = cursor.lastrowid  # Get the ID of the newly inserted flashcard
        for flashcard in flashcards:
            cursor.execute(
                    "INSERT INTO flashcard_items (flashcard_id, front, back) VALUES (%s, %s, %s)",
                    (flashcard_id, flashcard['front'], flashcard['back'])
                )
            
        mysql.connection.commit()
        print('Completed')

        # Return the list of flashcards
        return jsonify(flashcards), 200

    except Exception as e:
        print(str(e))
        return jsonify({"error": str(e)}), 500


@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    user_id = request.headers.get('User-ID')
    if not user_id:
        return jsonify({"error": "User is unauthorized"}), 400
    # Extract the file_id from the request
    data = request.get_json()
    file_id = data.get('file_id')

    cursor = mysql.connection.cursor()
    cursor.execute('SELECT * FROM reviewers WHERE docUrl=%s AND user_id = %s', (file_id, user_id))
    documents = cursor.fetchall()
    
    if len(documents) <= 0:
        return jsonify({"error": "No file ID provided"}), 400
    
    if not file_id:
        return jsonify({"error": "No file ID provided"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}")

    # Check if the file exists
    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        print('Processing....')

        # Open the PDF with PyMuPDF
        doc = fitz.open(file_path)

        # Total number of quiz items to create
        total_quiz_items = 30
        total_pages = len(doc)

        # Determine how many quiz items to generate per page
        items_per_page = total_quiz_items // total_pages
        extra_items = total_quiz_items % total_pages

        # List to store the quiz items
        quiz_items = []

        # Process each page, extract text, and generate quiz items
        for i, page in enumerate(doc):
            print(f"Processing page {i+1}")
            page_text = page.get_text("text")  # Extract text from the current page

            # Calculate the number of quiz items for this page
            quiz_items_for_page = items_per_page + (1 if i < extra_items else 0)

            # Prepare input for quiz generation
            quiz_input = f"This is page {i+1}, create {quiz_items_for_page} quiz questions with options (4 choices) and the correct answer index. Format as a list of JSON objects with the following structure: {{'question': '...', 'options': ['...', '...', '...', '...'], 'correctIndex': 0, 'explanation': '...'}}. Text: {page_text}"

            # Assuming model.generate_content generates the quiz content
            quiz_content = model.generate_content(quiz_input)  # Assuming model is defined elsewhere
            
            # Clean and format the generated content as JSON
            quiz_data = quiz_content.text.replace("```json", "").replace("```", "").replace("\n", "")

            try:
                # Parse the generated content into JSON
                quiz_json = json.loads(quiz_data)
               
                # Insert each question in the quiz
                for question_item in quiz_json: 
                    question = question_item.get('question', '').strip()
                    options = [opt.strip() for opt in question_item.get('options', [])]
                    correct_index = question_item.get('correctIndex', 0)
                    explanation = question_item.get('explanation', '').strip()
                
                    
                    # Add the question item to the quiz_items list
                    quiz_items.append({
                        "question": question,
                        "options": options,
                        "correctIndex": correct_index,
                        "explanation": explanation
                    })
            except json.JSONDecodeError:
                print(f"Error decoding JSON for page {i+1}")
                continue
        doc_id = documents[0][0]  # You will need to replace this with the actual document ID
        doc_title = documents[0][1]  # You will need to replace this with the actual document title
        # Insert a new quiz record (e.g., for 'Data Mining Fundamentals' quiz)
        cursor.execute('''INSERT INTO quizzes (docId, docTitle, timeLimit, category, totalQuestions, dateCreated, lastModified, user_id) 
                        VALUES ( %s, %s, %s, %s, %s, %s, %s, %s)''', 
                        (doc_id, doc_title + ' Quiz', 15, 'Database', 10, datetime.now(), datetime.now(), user_id))

        quiz_id = cursor.lastrowid

        for quiz_item in quiz_items:
            # Insert quiz item into database    
            cursor.execute('''INSERT INTO quiz_items (quiz_id, question, options, correctIndex, explanation) 
                            VALUES (%s, %s, %s, %s, %s)''',
                        (  # Generate unique item ID
                        quiz_id,  # Using quiz_id (this could be doc_id or i+1, as appropriate)
                        quiz_item['question'], 
                        json.dumps(quiz_item['options']),  # Store options as a JSON array
                        quiz_item['correctIndex'],
                        quiz_item['explanation']))  # Store the explanation
        mysql.connection.commit()
        # Close the cursor after processing all pages
        cursor.close()
        print(f"Generated quiz items: {quiz_items}")

        print('Completed')

        # Return the list of quiz items
        return jsonify( quiz_items), 200

    except Exception as e:
        print(str(e))
        return jsonify({"error": str(e)}), 500

debug = os.getenv('DEBUG', 'False').lower() == 'true'

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=debug)
