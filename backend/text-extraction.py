import re
import nltk
from collections import Counter
from nltk.corpus import stopwords
from nltk.tokenize import sent_tokenize, word_tokenize


# Download stopwords if not already downloaded
nltk.download('punkt')
nltk.download('stopwords')

def clean_text(text):
    # Remove punctuation and numbers
    text = re.sub(r'[^A-Za-z\s]', '', text.lower())
    return text

def summarize_with_word_frequencies(text, threshold=1.5):
    stop_words = set(stopwords.words('english'))
    
    # Clean the text
    cleaned_text = clean_text(text)
    
    # Split into sentences
    sentences = sent_tokenize(text)
    
    # Tokenize words and remove stopwords
    words = word_tokenize(cleaned_text)
    filtered_words = [word for word in words if word not in stop_words]
    
    # Count word frequencies
    word_frequencies = Counter(filtered_words)
    
    # Get frequency of the most common word
    max_frequency = word_frequencies.most_common(1)[0][1]
    
    # Calculate sentence scores
    sentence_scores = {}
    for sentence in sentences:
        sentence_clean = clean_text(sentence)
        sentence_words = word_tokenize(sentence_clean)
        sentence_score = sum(word_frequencies[word] for word in sentence_words if word in word_frequencies)
        sentence_score /= max_frequency  # Normalize score by the most frequent word
        sentence_scores[sentence] = sentence_score
    
    # Filter sentences by threshold
    summary = [sentence for sentence, score in sentence_scores.items() if score > threshold]
    
    return ' '.join(summary)

# Example usage
text = """Natural language processing (NLP) is a field of artificial intelligence (AI) that enables machines to understand, interpret, and generate human language. 
          It involves tasks such as speech recognition, sentiment analysis, translation, and more."""
summary = summarize_with_word_frequencies(text)

print(summary)
