from flask import Flask, jsonify
from pymongo import MongoClient

# 🚀 Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["movies"]
recommendations_collection = db["recommendations_collection"]
print("✅ Connected to MongoDB")

# 🚀 Flask API
app = Flask(__name__)

@app.route("/recommend/<int:movie_id>", methods=["GET"])
def recommend(movie_id):
    result = recommendations_collection.find_one({"movie_id": str(movie_id)}, {"_id": 0, "recommendations": 1})
    return jsonify(result["recommendations"] if result else [])

if __name__ == "__main__":
    app.run(port=5001 , debug=True)







# import pandas as pd
# from sklearn.feature_extraction.text import TfidfVectorizer
# import faiss
# import numpy as np
# from pymongo import MongoClient
# from flask import Flask, jsonify

# # 🚀 Connect to MongoDB
# client = MongoClient("mongodb://localhost:27017")
# db = client["movies"]
# movies_collection = db["tmdb1million"]
# recommendations_collection = db["recommendations_collection"]
# print("✅ Connected to MongoDB")

# # 🚀 Fetch data (only required fields)
# movies = list(movies_collection.find({}, {"_id": 0, "id": 1, "title": 1, "genres": 1, "overview": 1, "keywords": 1, "production_companies": 1}))
# df = pd.DataFrame(movies)
# df = df.sample(100000, random_state=42)

# print(f"✅ Fetched {len(df)} movies from MongoDB")

# # 🚀 Preprocess: Combine relevant text fields
# df["combined_features"] = df[["genres", "overview", "keywords", "production_companies"]].fillna('').astype(str).agg(' '.join, axis=1)
# print("✅ Preprocessed data")

# # 🚀 TF-IDF Vectorization
# tfidf = TfidfVectorizer(stop_words="english", max_features=300)
# tfidf_matrix = tfidf.fit_transform(df["combined_features"])
# print(f"✅ Vectorized data (TF-IDF) with shape {tfidf_matrix.shape}")

# # 🚀 Initialize FAISS Index
# d = tfidf_matrix.shape[1]  # Number of features
# index = faiss.IndexIDMap(faiss.IndexFlatL2(d))

# # 🚀 Add Vectors in Batches
# batch_size = 10000
# for i in range(0, len(df), batch_size):
#     batch = tfidf_matrix[i:i+batch_size].astype(np.float32).toarray()  # Sparse to Dense only for batch
#     ids = np.array(range(i, min(i+batch_size, len(df))), dtype=np.int64)
#     index.add_with_ids(batch, ids)
# print("✅ Built FAISS index")

# # 🚀 Store Recommendations (Optimized Batch Processing)
# batch_size = 1000
# recommendations = {}

# for i in range(0, len(df), batch_size):
#     batch_vectors = tfidf_matrix[i:i+batch_size].astype(np.float32).toarray()
#     _, batch_similar_indices = index.search(batch_vectors, 11)

#     for j, similar_indices in enumerate(batch_similar_indices):
#         movie_id = str(df.iloc[i + j]["id"])
#         similar_indices = similar_indices[1:]  # Remove self-match
#         recommendations[movie_id] = df.iloc[similar_indices][["id", "title"]].to_dict(orient="records")

# print("✅ Stored recommendations (Optimized)")

# # 🚀 Insert into MongoDB (Avoid 16MB Limit)
# recommendations_collection.delete_many({})
# bulk_insert = [{"movie_id": movie_id, "recommendations": recs} for movie_id, recs in recommendations.items()]
# recommendations_collection.insert_many(bulk_insert)
# print("✅ Inserted recommendations into MongoDB")

# # 🚀 Flask API
# app = Flask(__name__)

# @app.route("/recommend/<int:movie_id>", methods=["GET"])
# def recommend(movie_id):
#     result = recommendations_collection.find_one({"movie_id": str(movie_id)}, {"_id": 0, "recommendations": 1})
#     return jsonify(result["recommendations"] if result else [])

# if __name__ == "__main__":
#     app.run(debug=True)
