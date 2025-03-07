DROP TABLE IF EXISTS flashcard_items;
DROP TABLE IF EXISTS flashcards;
DROP TABLE IF EXISTS quiz_items;
DROP TABLE IF EXISTS selected_quizzes;
DROP TABLE IF EXISTS quiz_attempts;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS reviewers;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS user_profile;



CREATE TABLE documents (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    size VARCHAR(50) NOT NULL,
    modifiedDate TIMESTAMP NOT NULL,
    tags TEXT, -- This could be adjusted based on how you plan to store multiple tags
    url VARCHAR(255) NOT NULL
);

CREATE TABLE reviewers (
    docId VARCHAR(255) PRIMARY KEY,
    docTitle VARCHAR(255) NOT NULL,
    docUrl TEXT NOT NULL,
    size VARCHAR(50),
    modifiedDate DATE,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tags TEXT
);

ALTER TABLE reviewers ADD CONSTRAINT reviewers_docId FOREIGN KEY (docId) REFERENCES documents(id) ON DELETE CASCADE;

CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each quiz
    docId VARCHAR(255) NOT NULL,  -- Reference to the document ID related to the quiz (for your case, it could be a document or article)
    docTitle VARCHAR(255) NOT NULL,  -- Title of the document associated with the quiz
    timeLimit INT NOT NULL,  -- Time limit in seconds for the quiz
    category VARCHAR(100) NOT NULL,  -- Category or type of the quiz (e.g., 'Database')
    totalQuestions INT NOT NULL,  -- Total number of questions in the quiz
    dateCreated DATETIME NOT NULL,  -- Date the quiz was created
    lastModified DATETIME NOT NULL,  -- Date the quiz was last modified
    FOREIGN KEY (docId) REFERENCES documents(id) ON DELETE CASCADE  -- Assuming there's a documents table where docId is a foreign key
);

CREATE TABLE quiz_items (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each quiz item (composed of quiz ID and item number)
    quiz_id INT NOT NULL,  -- ID of the quiz this item belongs to
    question TEXT NOT NULL,  -- The quiz question
    options JSON NOT NULL,  -- JSON array storing the options for the question
    correctIndex INT NOT NULL,  -- Index of the correct answer in the options array
    explanation TEXT,  -- The explanation for the correct answer
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE  -- Ensures this is linked to the quizzes table
);




CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each quiz
    score INT NOT NULL,  -- Time limit in seconds for the quiz
    totalQuestions INT NOT NULL,  -- Title of the document associated with the quiz
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- Date the quiz was last modified
    end_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE selected_quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_attempt_id INT NOT NULL,
    quiz_id INT NOT NULL, 
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_attempt_id) REFERENCES quiz_attempts (id) ON DELETE CASCADE 
);

CREATE TABLE flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each quiz
    docId VARCHAR(255) NOT NULL,  -- Reference to the document ID related to the quiz (for your case, it could be a document or article)
    docTitle VARCHAR(255) NOT NULL,  -- Title of the document associated with the quiz
    dateCreated DATETIME NOT NULL,  -- Date the quiz was created
    FOREIGN KEY (docId) REFERENCES documents(id) ON DELETE CASCADE  -- Assuming there's a documents table where docId is a foreign key
);

CREATE TABLE flashcard_items (
    id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique identifier for each quiz
    flashcard_id INT NOT NULL,  -- Reference to the document ID related to the quiz (for your case, it could be a document or article)
    front VARCHAR(255) NOT NULL,  -- Title of the document associated with the quiz
    back VARCHAR(255) NOT NULL, -- Date the quiz was created
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE  -- Assuming there's a documents table where docId is a foreign key
);

CREATE TABLE user_profile (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Using 255 for hashed passwords
    profile_picture VARCHAR(255),    -- Stores file path/URL to image
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE documents ADD COLUMN user_id INT NOT NULL DEFAULT 1 REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE reviewers ADD COLUMN user_id INT NOT NULL DEFAULT 1  REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE flashcards ADD COLUMN user_id INT NOT NULL DEFAULT 1  REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE quizzes ADD COLUMN user_id INT NOT NULL DEFAULT 1  REFERENCES users (id) ON DELETE CASCADE;
ALTER TABLE quiz_attempts ADD COLUMN user_id INT NOT NULL DEFAULT 1  REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE quizzes
ADD CONSTRAINT fk_quizzes_docId
FOREIGN KEY (docId) REFERENCES documents(ID) ON DELETE CASCADE;

ALTER TABLE flashcards
ADD CONSTRAINT fk_flashcards_docId
FOREIGN KEY (docId) REFERENCES documents(ID) ON DELETE CASCADE;