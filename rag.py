import re
import io
import ollama
import chromadb
import pymupdf
import pytesseract
import pandas as pd
from PIL import Image
from tqdm import tqdm
from docling.document_converter import DocumentConverter
from langchain_text_splitters import RecursiveCharacterTextSplitter



EMBED_MODEL   = "nomic-embed-text"
LLM_MODEL     = "deepseek-r1:1.5b"
COLLECTION_NAME = "Project_doc"
CHUNK_SIZE    = 800
CHUNK_OVERLAP = 100
DEFAULT_TOP_K = 3



def text_format(text:str)-> str:
  cleaned_text=text.replace("\n"," ").strip()
  return cleaned_text


def open_and_read_pdf(pdf_path: str) -> list[dict]:
    doc = pymupdf.open(pdf_path)
    texts = []

    for i, page in tqdm(enumerate(doc), total=len(doc)):
        text = page.get_text().strip()
        used_ocr = False
        if len(text) < 50:
            pix = page.get_pixmap(dpi=300)
            img = Image.open(io.BytesIO(pix.tobytes()))
            text = pytesseract.image_to_string(img)
            used_ocr = True

        text = text_format(text)

        texts.append({
            "source": pdf_path,
            "source_page": i,
            "used_ocr": used_ocr,
            "page_char_count": len(text),
            "page_word_count": len(text.split()),
            "page_sentence_count_raw": len(text.split(". ")),
            "page_token_count": len(text) / 4,
            "text": text,
        })

    return texts

def open_and_read_document(file_path: str) -> list[dict]:
    converter = DocumentConverter()
    result    = converter.convert(file_path)
    full_text = text_format(result.document.export_to_markdown())

    return [{
        "source":               file_path,
        "source_page":          1,
        "page_char_count":      len(full_text),
        "page_word_count":      len(full_text.split()),
        "page_sentence_count_raw": len(full_text.split(". ")),
        "page_token_count":     len(full_text) / 4,
        "text":                 full_text,
    }]

def load_doc(file_path:str) -> list[dict]:
   if file_path.lower().endswith(".pdf"):
      return open_and_read_pdf(file_path)
   else:
      return open_and_read_document(file_path)
   

def dataset_create(texts):
    df=pd.DataFrame(texts)
    print(df.head())


def chunk_pages(texts:list[dict]) -> list[dict]:
  all_chunks=[]

  text_splitter=RecursiveCharacterTextSplitter(
    chunk_size=800,
    chunk_overlap=100,
    separators=["\n\n","\n",". "," ",""]
    )

  for page in texts:
    splits=text_splitter.split_text(page['text'])


    for i , chunk in enumerate(splits):
      all_chunks.append({
          "text":chunk,
          "source":page["source"],
          "source_page": page['source_page'],
          "chunk_id":i
      })
  return all_chunks


def generate_embeddings(chunks: list[dict]) -> list[dict]:
    print(f" Generating embeddings with  Ollama {EMBED_MODEL} model ...")

    for chunk in tqdm(chunks,desc="Embedding"):
      response=ollama.embeddings(model=EMBED_MODEL,prompt=chunk['text'])

      chunk['embedding'] = response['embedding']

    print("Embeddings Completed !!")
    return chunks
   

def embed_query(query :str) -> list[float]:
    response = ollama.embeddings(model=EMBED_MODEL, prompt=query)
    return response["embedding"]


def get_or_create_collection(collection_name:str=COLLECTION_NAME) ->chromadb.Collection:
   
    client=chromadb.Client()
    try:
      collection=client.get_collection(name=collection_name)
      print(f"Loaded Existing collection : {collection_name}")
    except Exception as e:
       collection=client.create_collection(name=collection_name)
       print(f"Created a new collection : {collection_name}")
    return collection

def store_chunks(chunks : list[dict] ,collection : chromadb.Collection) ->None:
   
    ids        = []
    embeddings = []
    metadatas  = []
    documents  = []
   
    for chunk in chunks:
       ids.append(f"{chunk['source']}_p{chunk['source_page']}_c{chunk['chunk_id']}")
       embeddings.append(chunk['embedding'])
       metadatas.append({
          'source' : chunk['source'],
          'source_page' : chunk['source_page'],
          'chunk_id' : chunk['chunk_id'],
       })

       documents.append(chunk['text'])

       collection.add(
          ids=ids,
          embeddings=embeddings,
          metadatas=metadatas,
          documents=documents,
       )
   
    print(f"Stored {len(chunks)} chunks in ChromaDB collection {collection.name}.")



def retrieve(query:str,collection:chromadb,top_k:int=DEFAULT_TOP_K) -> tuple[list[str],list[dict],list[float]]:
    query_embedding=embed_query(query)

    results=collection.query(
          query_embeddings=[query_embedding],
          n_results=top_k,
          include=['documents','metadatas','distances']
       )
    docs      = results["documents"][0]
    metadatas = results["metadatas"][0]
    scores    = results["distances"][0]

    return docs, metadatas, scores

def build_prompt(question:str,docs:list[str],metadatas:list[dict]) -> str:
    context_text = ""
    for doc in docs:
        context_text += f"{doc}\n\n"

    prompt = f"""
    You are a helpful assistant.
    Answer using ONLY the context below.
    If the answer is not explicitly stated in the context, say: "Not found in the document."
    Do not infer or assume.
    Answer clearly and concisely.

    Context:
    {context_text}

    Question:
    {question}
    """
    return prompt

def generate_answer(prompt:str) ->str:
   response = ollama.chat(
      model=LLM_MODEL,
      messages=[{"role": "user", "content": prompt}],
      options= {
         'temperature' : 0.2,
         "num_predict":1500,
         "num_ctx":4096,
         "top_p":0.9,
      }
   )
   
   raw_answer=response['message']['content']
   clean_answer = re.sub(r"<think>.*?</think>", "", raw_answer, flags=re.DOTALL).strip()

   return clean_answer if clean_answer else f"[Raw Output]: {raw_answer}"


def rag_query(
    question: str,
    collection: chromadb.Collection,
    top_k: int = DEFAULT_TOP_K,
) -> dict:

    if not question.strip():
        return {"answer": "Please provide a valid question.", "sources": []}

    docs, metadatas, scores = retrieve(question, collection, top_k)

    if not docs:
        return {"answer": "No relevant documents found.", "sources": []}

    prompt = build_prompt(question, docs, metadatas)
    answer = generate_answer(prompt)

    sources = [
        {
            "source":      m.get("source", "Unknown"),
            "source_page": m.get("source_page", "?"),
            "score":       round(s, 4),
            "snippet":     d[:200],
        }
        for d, m, s in zip(docs, metadatas, scores)
    ]


    return {"answer": answer ,"sources": sources}

def ingest_document(file_path: str, collection_name: str = COLLECTION_NAME) -> chromadb.Collection:

    print(f"\nLoading document: {file_path}")
    texts = load_doc(file_path)

    print(f"\n Chunking {len(texts)} page(s)...")
    chunks = chunk_pages(texts)
    print(f"      → {len(chunks)} chunks created")

    print(f"\nGenerating embeddings...")
    chunks = generate_embeddings(chunks)

    print(f"\nStoring in ChromaDB...")
    collection = get_or_create_collection(collection_name)
    store_chunks(chunks, collection)

    print(f"\nIngestion complete. Collection '{collection_name}' is ready.\n")
    return collection

def question(doc_path: str):
    collection = ingest_document(doc_path)

    print("Document ready! Let's start Q&A.\n")

    while True:
        user_input = input("Q: ").strip()
        if not user_input:
            print("Please enter a valid question.\n")
            continue

        result = rag_query(user_input, collection)
        print(f"\nA: {result['answer']}\n")
        follow_up = input("Do you want to ask another question? (yes/no): ").strip().lower()
        if follow_up in ("no", "n"):
            print("Goodbye!")
            break
        else:
            print()  


if __name__ == "__main__":
    question("C:/Synapse/RAG_Major/RAG_logic/legal.pdf")