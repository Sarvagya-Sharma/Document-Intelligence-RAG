# InstaDocs Analytics: Technical Reference

This document explains the methodology and calculations behind the technical metrics displayed in the InstaDocs Analytics dashboard.

## 1. Response Latency (ms)
**Goal:** Measure the end-to-end time taken for the system to process a user query and return a retrieval-augmented response.

- **Calculation Method:** Client-side high-resolution timing.
- **Implementation:** 
  - Uses the Web API `performance.now()` in `Chat.jsx`.
  - **Start Time:** Recorded immediately before the WebSocket sends the query payload.
  - **End Time:** Recorded the moment the WebSocket `onmessage` event receives the valid JSON response from the backend.
  - **Formula:** `latency = Math.round(EndTime - StartTime)`
- **Visualization:** Displayed as a **Line Chart** showing the latency trend across the last 20 queries.

## 2. Chunk Distribution
**Goal:** Track the granularity of document processing and the efficiency of the ingestion pipeline.

- **Calculation Method:** Backend document segmentation count.
- **Implementation:** 
  - During document ingestion in `rag.py`, the `ingest_document` function splits the document into semantic chunks.
  - The total count of these chunks (`len(chunks)`) is returned in the `/upload` API response.
  - The frontend captures this value and associates it with the document name.
- **Visualization:** Displayed as a **Bar Chart (Histogram)** showing the number of chunks generated for each of the last 10 documents.

## 3. Similarity Confidence (Similarity Scores)
**Goal:** Quantify the relevance and accuracy of the retrieved context used by the AI.

- **Calculation Method:** Vector database distance/similarity metrics.
- **Implementation:** 
  - ChromaDB retrieves the top-K chunks based on cosine similarity to the query embedding.
  - Each retrieved chunk in the `sources` array contains a `score` (e.g., `0.91`).
  - The dashboard visualizes the scores of the chunks used in the **most recent** query.
- **Visualization:** Displayed as a **Bar Chart** showing the confidence level for each retrieved chunk (Chunk 1, Chunk 2, etc.).

## 4. File Type Composition
**Goal:** Understand the variety of data sources being analyzed.

- **Calculation Method:** File extension parsing.
- **Implementation:** 
  - Captured during the file selection event in the browser.
  - Extensions are normalized to uppercase (e.g., `.pdf` -> `PDF`) and stored in a distribution map in `localStorage`.
- **Visualization:** Displayed as a **Bar Chart** showing the frequency of different file types (PDF, PPT, TXT, etc.).

---

## UI Design & Visual Effects

The InstaDocs frontend is built with a focus on premium aesthetics and smooth user experiences. Below are the key design systems and visual effects implemented:

### 1. Glassmorphism Design
- **Concept:** Every card and container uses a "frosted glass" effect to provide depth and modern appeal.
- **Implementation:** 
  - `backdrop-filter: blur(20px)` for high-clarity blurring of the background.
  - `rgba(255, 255, 255, 0.03)` backgrounds to maintain visibility while staying subtle.
  - Thin, semi-transparent borders (`rgba(255, 255, 255, 0.12)`) to define edges without being harsh.

### 2. Motion & Animations
- **Entrance Effects:** Uses **MUI Zoom** and **Fade** components to ensure analytics elements don't just appear, but "glide" into place.
- **Micro-interactions:**
  - **Stat Card Hover:** When hovered, cards scale up and icons rotate slightly (`8deg`), providing immediate tactile feedback.
  - **Twinkle Background:** A custom CSS `@keyframes` animation creates a living, breathing background with pulsating "stars" or focal points.
  - **FadeUp Sequences:** The header and main charts use staggered `fadeUp` animations to guide the user's eye from top to bottom.

### 3. Typography & Color Systems
- **Premium Font Pairings:**
  - **Abril Fatface:** Used for high-impact section headers.
  - **Outfit:** Optimized for numerical data and metrics to ensure maximum readability in the analytics cards.
  - **Inter / Space Grotesk:** Used for UI labels and navigation.
- **Vibrant Gradients:** Instead of flat colors, we use tailored HSL gradients (e.g., `linear-gradient(135deg, #ff6b6b, #ff8e53)`) for icons to create a high-end, futuristic feel.

### 4. Layout Stability
- **Native CSS Grid v2:** Replaced the legacy MUI Grid system with a custom **CSS Grid 2x2 layout**. This ensures 100% layout stability, preventing the "collapsing" issues often found in flex-based or margin-heavy frameworks.
- **Responsive Breakpoints:** The layout dynamically shifts from a 2x2 grid to a 1x1 vertical stack on mobile devices, ensuring the charts remain legible on all screens.

---

## Data Persistence
All analytics data is persisted in the browser's `localStorage` under the key `rag_analytics_data_v2`. This ensures that technical performance history is preserved across browser refreshes without requiring a heavy backend database for basic tracking.
