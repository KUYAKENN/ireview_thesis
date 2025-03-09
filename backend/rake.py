from rake_nltk import Rake
import pymupdf4llm
import re

# Convert PDF to markdown (This is your original line)
text = pymupdf4llm.to_markdown('./uploads/b73e8666-cffd-4a25-8e7a-290a8d69c6e5.pdf')

# Remove Markdown formatting using regex
# Remove headers (e.g., #, ##, ### etc.)
text = re.sub(r'^[#]+ .+', '', text, flags=re.MULTILINE)

# Remove other Markdown syntax like bold, italics, etc.
text = re.sub(r'(\*\*|\*|__|_)(.*?)\1', r'\2', text)  # Remove bold and italics
text = re.sub(r'`(.*?)`', r'\1', text)  # Remove inline code
text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)  # Remove links

# Initialize the Rake object
rake = Rake()

# Extract keywords and their scores
rake.extract_keywords_from_text(text)

# Get the list of keywords with their score
keywords_with_scores = rake.get_ranked_phrases_with_scores()

# Print the result
for i, (score, phrase) in enumerate(keywords_with_scores):
    print(f"Score: {score}, Keyword: {phrase}")
    if i > 100:  # Only print the top 100 keywords
        exit()
