import { useState, useRef, useEffect } from "react";
import Navbar from "./Navbar";
import "./Chat.css";
import ReactMarkdown from "react-markdown";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import * as analytics from "../utils/analytics";


function SourceChip({ source, index }) {
  const fileName = source.source.split(/[\\/]/).pop();

  return (
    <div className="source-chip" title={source.text?.trim()}>
      <ArticleRoundedIcon style={{ fontSize: 12 }} />
      <span className="chip-label">{index + 1}. {fileName}</span>
      <span className="chip-page">{source.page}</span>
    </div>
  );
}



function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`msg-row ${isUser ? "msg-row--user" : "msg-row--bot"}`}>
      <div className={`msg-avatar ${isUser ? "msg-avatar--user" : "msg-avatar--bot"}`}>
        {isUser ? <PersonRoundedIcon style={{ fontSize: 18 }} /> : <SmartToyRoundedIcon style={{ fontSize: 18 }} />}
      </div>
      <div className="msg-body">
        {/* Answer first */}
        <div className={`msg-bubble ${isUser ? "msg-bubble--user" : "msg-bubble--bot"}`}>
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        {/* Sources after, compact */}
        {!isUser && msg.sources?.length > 0 && (
          <div className="msg-sources">
            <span className="sources-label">Sources</span>
            <div className="sources-chips">
              {msg.sources.map((s, i) => <SourceChip key={i} source={s} index={i} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="msg-row msg-row--bot">
      <div className="msg-avatar msg-avatar--bot">
        <SmartToyRoundedIcon style={{ fontSize: 18 }} />
      </div>
      <div className="typing-bubble">
        <div className="typing-dots">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chat_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [collectionName, setCollectionName] = useState(() => {
    return localStorage.getItem("collection_name") || "";
  });
  const [uploadStatus, setUploadStatus] = useState(() => {
    const saved = localStorage.getItem("upload_status");
    return saved ? JSON.parse(saved) : null;
  });
  const [docUploaded, setDocUploaded] = useState(() => {
    return localStorage.getItem("doc_uploaded") === "true";
  });
  const [chatStarted, setChatStarted] = useState(() => {
    return localStorage.getItem("chat_started") === "true";
  });
  const [uploadLoading, setUploadLoading] = useState(false);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const inputRef = useRef(null);
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    localStorage.setItem("chat_messages", JSON.stringify(messages));
    localStorage.setItem("chat_started", chatStarted);
    localStorage.setItem("doc_uploaded", docUploaded);
    localStorage.setItem("collection_name", collectionName);
    localStorage.setItem("upload_status", JSON.stringify(uploadStatus));
  }, [messages, chatStarted, docUploaded, collectionName, uploadStatus]);

  const normalizeCollectionName = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 50);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setUploadFile(file);
    if (file) setUploadStatus({ type: "ready", text: `${file.name} selected` });
  };

  const uploadDocument = async () => {
    if (!uploadFile) {
      setUploadStatus({ type: "error", text: "Please choose a file first." });
      return;
    }
    const fileCollection = normalizeCollectionName(uploadFile.name || "uploaded-doc");
    const formData = new FormData();
    formData.append("file", uploadFile);
    setUploadLoading(true);
    setUploadStatus({ type: "loading", text: `Uploading ${uploadFile.name}...` });

    try {
      const res = await fetch(
        `http://127.0.0.1:8000/upload?collection_name=${encodeURIComponent(fileCollection)}`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setCollectionName(data.collection_name);
      setDocUploaded(true);
      setUploadStatus({ type: "success", text: `${data.file_name} ready` });
      analytics.trackDocUpload(uploadFile, data.chunk_count);
    } catch (err) {
      setUploadStatus({ type: "error", text: err.message });
    } finally {
      setUploadLoading(false);
    }
  };

  const sendQuestionViaWebSocket = (question) => {
    const wsUrl = `ws://127.0.0.1:8000/ws?collection_name=${encodeURIComponent(collectionName || "Project_doc")}`;
    const socket = new WebSocket(wsUrl);
    const startTime = performance.now();

    socket.onopen = () => socket.send(JSON.stringify({ question, top_k: 3 }));

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            content: data.answer || data.error || "No answer returned.",
            sources: data.sources || [],
          },
        ]);
        const latency = Math.round(performance.now() - startTime);
        analytics.trackQuery(latency, data.sources);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "Received an invalid response.", sources: [] },
        ]);
      } finally {
        setTyping(false);
        socket.close();
      }
    };

    socket.onerror = () => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "WebSocket connection failed. Is the backend running?", sources: [] },
      ]);
      setTyping(false);
    };
  };

  const resetChat = () => {
    setMessages([]);
    setChatStarted(false);
    setInput("");
    setDocUploaded(false);
    setUploadFile(null);
    setUploadStatus(null);
    localStorage.removeItem("chat_messages");
    localStorage.removeItem("chat_started");
    localStorage.removeItem("doc_uploaded");
    localStorage.removeItem("collection_name");
    localStorage.removeItem("upload_status");
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    if (!docUploaded) {
      setUploadStatus({ type: "error", text: "Upload a document before asking questions." });
      return;
    }
    if (!chatStarted) {
      setChatStarted(true);
    }
    setMessages((prev) => [...prev, { role: "user", content: input, sources: [] }]);
    setInput("");
    setTyping(true);
    sendQuestionViaWebSocket(input);
  };

  const statusIcon = {
    success: <CheckCircleRoundedIcon style={{ fontSize: 15, color: "#4ade80" }} />,
    error: <ErrorRoundedIcon style={{ fontSize: 15, color: "#f87171" }} />,
    loading: <span className="spinner" />,
    ready: <AttachFileRoundedIcon style={{ fontSize: 15 }} />,
  };

  return (
    <div className={`cw ${chatStarted ? "cw--active" : ""}`}>
      <div className="cw__navbar"><Navbar /></div>

      {!chatStarted && (
        <div className="cw__hero">
          <div className="cw__hero-logo-container">
            <SmartToyRoundedIcon style={{ fontSize: 48, color: '#fff' }} />
          </div>
          <h1 className="cw__hero-title">{getGreeting()} Explorer</h1>
          <p className="cw__hero-sub"><i>~ Your Intelligent Document Partner.</i></p>
        </div>
      )}

      <div className={`cw__shell ${chatStarted ? "cw__shell--expanded" : ""}`}>

        {chatStarted && (
          <div className="cw__messages">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}

        <div className="cw__input-area">
          <div className="cw__upload-row">
            <button
              className="cw__file-btn"
              onClick={() => fileRef.current?.click()}
              title="Attach document"
            >
              <AttachFileRoundedIcon style={{ fontSize: 18 }} />
              <span>{uploadFile ? uploadFile.name : "Attach document"}</span>
            </button>
            <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
              accept=".pdf,.txt,.md,.doc,.docx,.pptx,.ppt,.xlsx,.xls,.xlsm"
            />
            <button
              className={`cw__upload-btn ${uploadLoading ? "cw__upload-btn--loading" : ""}`}
              onClick={uploadDocument}
              disabled={uploadLoading || !uploadFile}
            >
              <UploadFileRoundedIcon style={{ fontSize: 17 }} />
              <span>{uploadLoading ? "Uploading…" : "Upload"}</span>
            </button>
            {uploadStatus && (
              <span className={`cw__status cw__status--${uploadStatus.type}`}>
                {statusIcon[uploadStatus.type]}
                {uploadStatus.text}
              </span>
            )}

            {chatStarted && (
              <button
                className="cw__reset-btn"
                onClick={resetChat}
                title="New Chat"
              >
                <RefreshRoundedIcon style={{ fontSize: 18 }} />
                <span>New Chat</span>
              </button>
            )}
          </div>

          <div className="cw__composer">
            <input
              ref={inputRef}
              className="cw__text-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder={docUploaded ? "Ask anything about your document…" : "Upload a document to begin…"}
              disabled={!docUploaded}
            />
            <button
              className={`cw__send-btn ${input.trim() && docUploaded ? "cw__send-btn--active" : ""}`}
              onClick={sendMessage}
              disabled={!input.trim() || !docUploaded}
            >
              <SendRoundedIcon style={{ fontSize: 18 }} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}