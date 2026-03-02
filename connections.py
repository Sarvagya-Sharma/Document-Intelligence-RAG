import os
import shutil
import tempfile
import chromadb
from fastapi import FastAPI,File,UploadFile,HTTPException
from pydantic import BaseModel

from rag import ingest_document, rag_query, COLLECTION_NAME


_collections: dict[str, chromadb.Collection] = {}



app=FastAPI(title="RAG API")

class QueryRequest(BaseModel):
    question : str
    collection_name : str = COLLECTION_NAME
    top_k : int = 3

class QueryResponse(BaseModel):
    answer : str
    sources : list[dict]

class IngestResponse(BaseModel):
    message :str
    collection_name :str
    file_name :str


class HealthResponse(BaseModel):
    status:  str
    message: str


@app.get("/")
async def home():
    return {"Message" : "Intelligent Document Question Answering System"}


@app.get("/health",response_model=HealthResponse,tags=['Utility'])

def health_check():
    return {"status":"ok", "message" : "RAG API is running."}

@app.post("/upload",response_model=IngestResponse,tags=["Document"])

async def upload(file : UploadFile =File(...),collection_name : str = COLLECTION_NAME):
    suffix=os.path.splitext(file.filename)[-1]
    tmp_path=None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        collection = ingest_document(tmp_path, collection_name)
        _collections[collection_name] = collection

        return {
            "message":         f"Document '{file.filename}' ingested successfully.",
            "collection_name": collection_name,
            "file_name":       file.filename,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/query",response_model=QueryResponse,tags=['Query'])

def query(request :  QueryRequest):
    collection= _collections.get(request.collection_name)

    if collection is None:
        raise HTTPException(status_code=404,detail=f"Collection '{request.collection_name}' not found.")
    
    result = rag_query(question=request.question,collection=collection,top_k=request.top_k)

    return result



@app.get("/collections", tags=["Utility"])
def list_collections():
    return {"collections": list(_collections.keys())}




if __name__=="__main__":
    import uvicorn
    uvicorn.run(app,host="127.0.0.1",port=8000)