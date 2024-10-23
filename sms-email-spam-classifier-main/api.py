from flask import Flask, request, jsonify
import pickle
import string
from nltk.corpus import stopwords
import nltk
from nltk.stem.porter import PorterStemmer
import numpy as np
from flask_cors import CORS

nltk.download('stopwords')
nltk.download('punkt')

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "chrome-extension://odbmmpkafjnmmolhjfhalcohdmjijoep"}})
#, resources={r"/predict": {"origins": "chrome-extension://npagnacikbhbabhmgandlhcofkopodij"}}

ps = PorterStemmer()

def transform_text(text):
    ps = PorterStemmer()
    text = text.lower()
    text = nltk.word_tokenize(text)
    
    y = []
    for i in text:
        if i.isalnum():
            y.append(i)
    
    text = y[:]
    y.clear()
    
    for i in text:
        if i not in stopwords.words('english') and i not in string.punctuation:
            y.append(i)
            
    text = y[:]
    y.clear()
    
    for i in text:
        y.append(ps.stem(i))
    
            
    return " ".join(y)

tfidf = pickle.load(open('vectorizer.pkl', 'rb'))
model = pickle.load(open('model.pkl', 'rb'))

@app.route('/predict', methods=['POST'])
def predict():
    message = request.json['message']
    transformed_sms = transform_text(message)
    vector_input = tfidf.transform([transformed_sms])
    result = model.predict(vector_input)[0]
    return jsonify({'prediction': int(result)})

if __name__ == '__main__':
    app.run(debug=True)
