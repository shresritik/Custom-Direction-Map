from flask import Flask, jsonify, request
from flask_cors import CORS
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


@app.route('/api/response', methods=['POST'])
def post_response():
    data = request.json['response']
    print(data)
    return jsonify({"message": "success"})


if __name__ == '__main':
    app.run()
