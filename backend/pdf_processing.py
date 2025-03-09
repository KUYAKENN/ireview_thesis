# Improved PDF processing functions 
import nltk
from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords
from rake_nltk import Rake
import re
import fitz  # PyMuPDF
import pymupdf4llm

# Ensure NLTK resources are downloaded
nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)

def extract_text_from_pdf(pdf_path):
    """Extract text using both markdown and direct methods for best results"""
    # Use pymupdf4llm markdown extraction
    text_markdown = pymupdf4llm.to_markdown(pdf_path)
    
    # Also use direct PyMuPDF extraction as alternative
    doc = fitz.open(pdf_path)
    text_direct = ""
    for page in doc:
        text_direct += page.get_text("text") + "\n\n"
    
    # Choose the better extraction method based on content length
    text = text_markdown if len(text_markdown) > len(text_direct) else text_direct
    
    # Improved cleaning with better regex patterns
    # Remove headers but preserve the content
    text = re.sub(r'^[#]+ (.+)', r'\1', text, flags=re.MULTILINE)
    
    # Remove markdown formatting but preserve content
    text = re.sub(r'(\*\*|\*|__|_)(.*?)\1', r'\2', text)  # Bold/italics
    text = re.sub(r'`(.*?)`', r'\1', text)  # Inline code
    text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Links
    text = re.sub(r'!\[.*?\]\(.*?\)', '', text)  # Images
    
    # Remove excessive whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {2,}', ' ', text)
    
    return text

def chunk_by_sentences(text, max_chunk_size=5000, overlap=500): 
    """
    Split text into chunks based on sentence boundaries
    with optional overlap between chunks
    """
    sentences = sent_tokenize(text)
    chunks = []
    current_chunk = []
    current_size = 0
    
    for sentence in sentences:
        sentence_size = len(sentence) + 1
        
        if current_size + sentence_size > max_chunk_size and current_chunk:
            # Join current chunk and add to chunks
            chunks.append(' '.join(current_chunk))
            
            # Create overlap by keeping some sentences
            overlap_sentences = []
            overlap_size = 0
            
            for prev_sentence in reversed(current_chunk[-5:]):  # Take up to 5 last sentences
                if overlap_size + len(prev_sentence) <= overlap:
                    overlap_sentences.insert(0, prev_sentence)
                    overlap_size += len(prev_sentence) + 1
                else:
                    break
            
            # Start new chunk with overlap sentences
            current_chunk = overlap_sentences
            current_size = overlap_size
        
        current_chunk.append(sentence)
        current_size += sentence_size
    
    # Add the last chunk
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def extract_key_terms(text, top_n=100):
    """Extract important terms from text using RAKE algorithm"""
    custom_stopwords = set(stopwords.words('english'))
    rake = Rake(stopwords=custom_stopwords, min_length=2, max_length=4)
    rake.extract_keywords_from_text(text)
    
    # Get ranked phrases with scores
    keywords = rake.get_ranked_phrases_with_scores()
    
    # Filter out low-scoring terms
    filtered_keywords = [(score, phrase) for score, phrase in keywords 
                         if len(phrase) > 3 and score > 4]
    
    return filtered_keywords[:top_n]

def create_enhanced_prompt(chunk, key_terms=None, chunk_index=0, total_chunks=1):
    """
    Create a prompt that generates a reviewer using ONLY information from the PDF
    """
    key_terms_text = ""
    if key_terms:
        top_terms = [term for _, term in key_terms[:15]]
        key_terms_text = f", focusing specifically on these key concepts found in the text: {', '.join(top_terms)}"
    
    current_position = ""
    if total_chunks > 1:
        current_position = f"This is part {chunk_index+1} of {total_chunks} from the document. "
    
    prompt = f"""{current_position}Create a comprehensive reviewer USING ONLY INFORMATION EXPLICITLY STATED in this text{key_terms_text}.

STRICT REQUIREMENTS:
1. Include ONLY information explicitly found in the provided text
2. DO NOT add any external facts, definitions, or explanations not present in the text
3. If a concept is only briefly mentioned, keep your explanation equally brief
4. Format as professional HTML/CSS with black text, blue for important terms
5. Use tables, bullet points, and clear headings for organization
6. For key takeaways, summarize ONLY points that appear in the text
7. DO NOT invent, extrapolate, or add any information not explicitly stated
8. If the text is limited on a topic, your reviewer should also be limited on that topic
9. Maintain strict fidelity to the source material

Text to create reviewer from: {chunk}"""
    
    return prompt