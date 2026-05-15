# 🧠 Document Intelligence RAG System
### A Production-Oriented Retrieval-Augmented Generation Platform

> Upload any document. Ask anything. Get grounded, accurate answers — not hallucinations.


---

## 📖 Overview

Large Language Models are powerful but blind to your private documents — and prone to hallucination when guessing. This project implements a full **Retrieval-Augmented Generation (RAG)** pipeline that grounds every answer in your actual document content.

Upload a PDF, PowerPoint, Excel sheet, or Word document. Ask questions in natural language. The system retrieves the most relevant passages and feeds them to the LLM — so answers are accurate, cited, and traceable to a source page.

Built as a major internship project with a focus on practical LLM system design, hybrid retrieval, and production readiness.

---

## 🖼️ Screenshots


### Home Section
<img width="1908" height="906" alt="Screenshot 2026-05-10 000928" src="https://github.com/user-attachments/assets/652ca2ba-ca61-46c9-a4a5-fd64b2a1d56c" />

### About Section
<img width="1890" height="903" alt="Screenshot 2026-05-10 001009" src="https://github.com/user-attachments/assets/c06ef66e-fff9-477b-9dae-2e6d7f5fddff" />

### Chat Section
<img width="1902" height="900" alt="Screenshot 2026-05-10 003055" src="https://github.com/user-attachments/assets/c0c3d64e-b32f-4c4b-a472-dbae4de82981" />

### Answer with Sources
<img width="1886" height="908" alt="Screenshot 2026-05-15 115606" src="https://github.com/user-attachments/assets/34419396-a94b-41f6-8cca-a7f407cb06f2" />

### Analytics Section
<img width="1888" height="913" alt="Screenshot 2026-05-15 115402" src="https://github.com/user-attachments/assets/c23e1ddf-8cf8-447c-a7fe-99dd9e577aab" />


## ✨ Key Features

- **Multi-Format Ingestion** — PDF (with OCR fallback for scanned pages), PPTX, XLSX, DOCX, TXT, Markdown
- **Semantic Chunking** — Sentence-level splitting with cosine-distance breakpoints instead of naive fixed-size chunks
- **Hybrid Retrieval** — Dense vector search (ChromaDB) + sparse BM25, fused via Reciprocal Rank Fusion (RRF)
- **Cross-Encoder Reranking** — Reranks top candidates with `ms-marco-MiniLM-L-6-v2` before generation
- **Grounded Generation** — Gemini/Gemma-4 answers strictly from retrieved context; never guesses
- **Ollama Fallback** — Automatically switches to local Mistral when Gemini returns a 500 error
- **Source Citations** — Every answer links back to the exact page, slide, or sheet it came from
- **WebSocket Streaming** — Real-time response delivery to the React frontend
- **RAG Evaluation Suite** — LangSmith-integrated evaluators for correctness, groundedness, relevance, and retrieval quality
- **ChatGPT-style UI** — Conversational interface with document upload, session persistence, and analytics

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        INGESTION PIPELINE                   │
│                                                             │
│  Document Upload                                            │
│      │                                                      │
│      ▼                                                      │
│  File Router ──► PDF (pymupdf + OCR)                        │
│                ──► PPTX (python-pptx, recursive shapes)     │
│                ──► XLSX (openpyxl, markdown tables)         │
│                ──► DOCX/TXT (docling)                       │
│      │                                                      │
│      ▼                                                      │
│  Semantic Chunker (sentence-level + cosine breakpoints)     │
│      │                                                      │
│      ▼                                                      │
│  Embedder (all-MiniLM-L6-v2)                                │
│      │                                                      │
│      ▼                                                      │
│  ChromaDB Vector Store                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        QUERY PIPELINE                       │
│                                                             │
│  User Question                                              │
│      │                                                      │
│      ├──► Dense Retrieval (ChromaDB, top-20)                │
│      └──► Sparse Retrieval (BM25Okapi, top-20)              │
│                  │                                          │
│                  ▼                                          │
│          Reciprocal Rank Fusion (RRF)                       │
│                  │                                          │
│                  ▼                                          │
│          Cross-Encoder Reranker → top-5 chunks              │
│                  │                                          │
│                  ▼                                          │
│          Prompt Builder (context + instructions)            │
│                  │                                          │
│                  ▼                                          │
│     Gemini/Gemma-4 ──(500 error?)──► Ollama Mistral         │
│                  │                                          │
│                  ▼                                          │
│       Answer + Sources (page/slide/sheet cited)             │
└─────────────────────────────────────────────────────────────┘
```
<img width="835" height="609" alt="ChatGPT Image May 10, 2026, 04_06_21 PM_r1_c1_r1_c1" src="https://github.com/user-attachments/assets/68a7a135-b10a-431c-a52b-2b64dde96c1c" />


---


## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, WebSocket, ReactMarkdown, MUI Icons |
| **Backend** | FastAPI, Python 3.11+ |
| **Vector DB** | ChromaDB (in-memory / persistent) |
| **Embeddings** | `sentence-transformers/all-MiniLM-L6-v2` |
| **Reranker** | `cross-encoder/ms-marco-MiniLM-L-6-v2` |
| **Sparse Retrieval** | BM25Okapi (`rank-bm25`) |
| **Primary LLM** | Google Gemini / Gemma-4 (`google-genai`) |
| **Fallback LLM** | Mistral via Ollama (local) |
| **PDF Parsing** | PyMuPDF + Tesseract OCR |
| **PPTX Parsing** | `python-pptx` (recursive shape extraction) |
| **XLSX Parsing** | `openpyxl` |
| **DOCX Parsing** | Docling |
| **Evaluation** | LangSmith |

---

## 📁 Project Structure

```
Document-Intelligence-RAG/
│
├── backend/
│   ├── connections.py          # FastAPI app — upload endpoint, WebSocket Q&A
│   ├── rag.py                  # Core RAG pipeline (ingestion, retrieval, generation)
│   └── .env                    # API keys (not committed)
│
├── frontend/
│   └── rag/                    # Vite + React app
│       ├── public/
│       ├── src/
│       │   ├── assets/
│       │   │   └── earth.mp4   # Background video asset
│       │   ├── components/     # Chat, Navbar, UI components
│       │   ├── utils/          # Analytics and helper utilities
│       │   ├── App.jsx
│       │   ├── App.css
│       │   ├── main.jsx
│       │   └── index.css
│       ├── index.html
│       ├── vite.config.js
│       └── package.json
│
├── images/
│   ├── flow.png                # RAG architecture diagram
│   └── banner.png              # Project banner
│
├── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Tesseract OCR — [Install guide](https://github.com/UB-Mannheim/tesseract/wiki)
- Ollama (optional, for local fallback) — [ollama.ai](https://ollama.ai)
- Google Gemini API key — [Get one here](https://aistudio.google.com)

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/your-username/document-intelligence-rag.git
cd document-intelligence-rag

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Add your GOOGLE_API_KEY to .env

# (Optional) Pull Mistral for local fallback
ollama pull mistral

# Start the backend
uvicorn backend.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🔍 How Hybrid Retrieval Works

Most RAG systems use only dense vector search. This system combines two complementary approaches:

**Dense retrieval** (semantic) finds conceptually similar passages even when exact words differ. Good for paraphrased questions.

**Sparse retrieval** (BM25) finds passages with exact keyword matches. Good for proper nouns, technical terms, and specific values.

Both return their top-20 candidates. **Reciprocal Rank Fusion** merges them by rank position (not score), so neither method dominates unfairly. The fused list is then reranked by a **Cross-Encoder** that scores each (query, passage) pair jointly — much more accurate than bi-encoder similarity alone.

The final top-5 passages go into the prompt.

---

## 📊 Evaluation

The system includes a LangSmith-based evaluation suite with four automatic metrics:

| Metric | What it checks |
|---|---|
| **Correctness** | Does the answer match the ground truth factually? |
| **Groundedness** | Is every claim in the answer supported by retrieved chunks? |
| **Relevance** | Is the answer focused and on-topic? |
| **Retrieval Relevance** | Did the retriever actually fetch relevant chunks? |

All four are evaluated by Gemini acting as a judge, with structured JSON output for traceability.

To run an evaluation:

```python
from backend.rag import ingest_document, evaluate_rag

collection, _ = ingest_document("your_document.pdf", original_name="your_document.pdf", collection_name="eval")

evaluate_rag(
    collection=collection,
    dataset_name="My Eval Dataset",
    experiment_prefix="my-experiment",
    test_cases=[
        {"question": "...", "ground_truth": "..."},
        # ...
    ]
)
```

Results appear in your [LangSmith dashboard](https://smith.langchain.com).

---

## 🔧 Configuration

Key parameters in `rag.py`:

```python
SEMANTIC_BREAKPOINT_THRESHOLD = 0.35   # Cosine distance to split a new chunk
MAX_CHUNK_TOKENS = 800                 # Max chars before forcing a split
MIN_CHUNK_CHARS  = 80                  # Discard chunks shorter than this
DENSE_TOP_K  = 20                      # Candidates from vector search
SPARSE_TOP_K = 20                      # Candidates from BM25
FINAL_TOP_K  = 5                       # Chunks sent to LLM after reranking
RRF_K        = 60                      # RRF smoothing constant
BM25_WEIGHT  = 0.4                     # Weight for sparse vs dense fusion
```

---

## 🧪 Supported File Types

| Format | Parser | Notes |
|---|---|---|
| `.pdf` | PyMuPDF + Tesseract | OCR fallback for scanned/image pages |
| `.pptx` | python-pptx | Recursive shape extraction, speaker notes |
| `.xlsx` / `.xls` | openpyxl | Each sheet as a markdown table |
| `.docx` | Docling | Full document with formatting |
| `.txt` / `.md` | Docling | Plain text |
=======
### **Frontend**
- **Framework**: React.js with Vite
- **Styling**: Vanilla CSS (Premium Custom Design)
- **Visuals**: Earth Video Backgrounds, Lucide Icons

### **Backend**
- **API Framework**: FastAPI (Asynchronous)
- **Document Processing**: Docling, PyMuPDF, Pytesseract (OCR)
- **Orchestration**: Custom RAG Pipeline

### **AI & Data**
- **LLM**: Google Gemini 1.5 Pro / Flash
- **Vector DB**: ChromaDB
- **Tracing**: LangSmith

---

## ⚙️ Getting Started

### **1. Prerequisites**
- Python 3.9+
- Node.js & npm
- Google AI Studio API Key

### **2. Backend Setup**
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Configure environment variables (.env)
GOOGLE_API_KEY=your_api_key_here
```

### **3. Frontend Setup**
```bash
# Navigate to frontend directory
cd frontend/rag

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📸 Screenshots

| Dashboard | Chat Interface |
|-----------|----------------|
| ![Analytics](images/analytics_placeholder.png) | ![Chat](images/chat_placeholder.png) |

*(Note: Add actual screenshots to the `images/` folder and update the links above)*

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
>>>>>>> e173043 (Updated the code for frontend and backend)

---

## 🙏 Acknowledgements

- [Sentence Transformers](https://www.sbert.net/) for embedding and reranking models
- [ChromaDB](https://www.trychroma.com/) for the vector store
- [Google Gemini](https://deepmind.google/technologies/gemini/) for the primary LLM
- [Ollama](https://ollama.ai/) for local model fallback
- [LangSmith](https://smith.langchain.com/) for RAG evaluation infrastructure
=======
Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Developed with ❤️ for Document Intelligence
</p>
>>>>>>> e173043 (Updated the code for frontend and backend)
