import spacy
import networkx as nx
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import pymupdf4llm
import re
import google.generativeai as genai
# Convert PDF to markdown (This is your original line)
text = pymupdf4llm.to_markdown('./uploads/b73e8666-cffd-4a25-8e7a-290a8d69c6e5.pdf')

# Remove Markdown formatting using regex
# Remove headers (e.g., #, ##, ### etc.)
text = re.sub(r'^[#]+ .+', '', text, flags=re.MULTILINE)

# Remove other Markdown syntax like bold, italics, etc.
text = re.sub(r'(\*\*|\*|__|_)(.*?)\1', r'\2', text)  # Remove bold and italics
text = re.sub(r'`(.*?)`', r'\1', text)  # Remove inline code
text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Remove links
text = re.sub(r'\s+', ' ', text).strip()
import nltk
nltk.download('punkt')
sentences = nltk.sent_tokenize(text)
# Load spaCy's English tokenizer
nlp = spacy.load("en_core_web_sm")

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

# Example usage
# text = """Natural language processing (NLP) is a field of artificial intelligence (AI) that enables machines to understand, interpret, and generate human language. 
#           It involves tasks such as speech recognition, sentiment analysis, translation, and more."""
unique_sentences = remove_redundancy(sentences, threshold=0.8)
summary = ''.join([sentence for sentence in unique_sentences])
genai.configure(api_key="AIzaSyDR1Lxpk_tpQetj6LdaiMOWD_xEvl873W0")
model = genai.GenerativeModel("gemini-1.5-flash")
review_input = f"Summarize this straight into a complete reviewer, define terms, complete exercises, keep definitions short and add bullets, write response in html and css, format well with black font as default color, use tables for readability, bold titles, for important terms highlight in blue font color: {summary}"
page_review = model.generate_content(review_input)  # Ass
print(page_review.text)
