const ANALYTICS_KEY = 'rag_analytics_data_v2';

const getInitialData = () => ({
  docsUploaded: 0,
  totalInputs: 0,
  aiResponses: 0,
  resourceDistribution: {}, // { 'PDF': 5, 'PPT': 2 }
  latencyData: [], // { time: '12:01', value: 450 }
  chunkData: [], // { name: 'file.pdf', count: 120 }
  similarityData: [], // { label: 'Chunk 1', score: 0.91 }
});

const getAnalytics = () => {
  const data = localStorage.getItem(ANALYTICS_KEY);
  if (!data) return getInitialData();
  try {
    return JSON.parse(data);
  } catch (e) {
    return getInitialData();
  }
};

const saveAnalytics = (data) => {
  localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
};

export const trackDocUpload = (file, chunkCount) => {
  const data = getAnalytics();
  data.docsUploaded += 1;
  
  const ext = file.name.split('.').pop().toUpperCase();
  data.resourceDistribution[ext] = (data.resourceDistribution[ext] || 0) + 1;
  
  data.chunkData.push({
    name: file.name,
    count: chunkCount
  });
  
  if (data.chunkData.length > 10) data.chunkData.shift(); // Keep last 10
  
  saveAnalytics(data);
};

export const trackQuery = (latency, sources) => {
  const data = getAnalytics();
  data.totalInputs += 1;
  data.aiResponses += 1;
  
  const now = new Date();
  const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  data.latencyData.push({
    time: timeStr,
    value: latency
  });
  
  if (data.latencyData.length > 20) data.latencyData.shift();
  
  // Track similarity scores of the top retrieved chunks
  if (sources && sources.length > 0) {
    data.similarityData = sources.map((s, i) => ({
      label: `Chunk ${i + 1}`,
      score: s.score || 0
    }));
  }
  
  saveAnalytics(data);
};

export const getAnalyticsData = () => {
  return getAnalytics();
};

export const resetAnalytics = () => {
  saveAnalytics(getInitialData());
};
