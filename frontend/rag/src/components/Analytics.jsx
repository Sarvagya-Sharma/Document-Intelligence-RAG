import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import './Analytics.css';
import { BarChart, LineChart } from '@mui/x-charts';
import { Fade, Zoom, Box } from '@mui/material';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import QuestionAnswerRoundedIcon from '@mui/icons-material/QuestionAnswerRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import BarChartRoundedIcon from '@mui/icons-material/BarChartRounded';
import HubRoundedIcon from '@mui/icons-material/HubRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import { getAnalyticsData } from '../utils/analytics';

const StatCard = ({ title, value, icon, color, delay }) => (
  <Zoom in={true} style={{ transitionDelay: `${delay}ms` }}>
    <div className="stat-card">
      <div className="stat-card-content">
        <div className="stat-icon" style={{ background: color }}>
          {React.cloneElement(icon, { sx: { fontSize: 30 } })}
        </div>
        <div className="stat-info">
          <span className="stat-label">{title}</span>
          <span className="stat-value">
            {typeof value === 'number' ? new Intl.NumberFormat().format(value) : value}
          </span>
        </div>
      </div>
    </div>
  </Zoom>
);

const EmptyState = ({ message }) => (
  <div className="empty-state">
    <AutoAwesomeRoundedIcon sx={{ fontSize: 40, mb: 2, opacity: 0.2 }} />
    <p>{message}</p>
  </div>
);

const Analytics = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const stats = getAnalyticsData();
    setData(stats);
  }, []);

  if (!data) return null;

  const fileData = Object.keys(data.resourceDistribution).map(type => ({
    type, value: data.resourceDistribution[type]
  }));

  return (
    <div className="analytics-container">
      <Navbar />
      
      <div className="analytics-content">
        <Fade in={true} timeout={800}>
          <header className="analytics-header">
            <h1 className="analytics-title">Performance Analytics</h1>
            <p className="analytics-subtitle">Technical metrics for your intelligent document processing system.</p>
          </header>
        </Fade>

        <div className="stats-grid">
          <StatCard 
            title="Docs Uploaded" 
            value={data.docsUploaded} 
            icon={<InsertDriveFileRoundedIcon />} 
            color="linear-gradient(135deg, #ff6b6b, #ff8e53)"
            delay={100}
          />
          <StatCard 
            title="Total Queries" 
            value={data.totalInputs} 
            icon={<QuestionAnswerRoundedIcon />} 
            color="linear-gradient(135deg, #4facfe, #00f2fe)"
            delay={200}
          />
          <StatCard 
            title="AI Responses" 
            value={data.aiResponses} 
            icon={<AutoAwesomeRoundedIcon />} 
            color="linear-gradient(135deg, #00e5cc, #00bbcc)"
            delay={300}
          />
        </div>

        <div className="charts-grid-v2">
          {/* 1. File Type Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">
              <BarChartRoundedIcon sx={{ color: '#ff6b6b' }} />
              File Type Distribution
            </h3>
            {fileData.length > 0 ? (
              <Box height={300}>
                <BarChart
                  xAxis={[{ data: fileData.map(d => d.type), scaleType: 'band' }]}
                  series={[{ data: fileData.map(d => d.value), color: '#ff6b6b' }]}
                  height={300}
                  margin={{ left: 40, right: 20, top: 20, bottom: 40 }}
                />
              </Box>
            ) : <EmptyState message="No documents uploaded" />}
          </div>

          {/* 2. Query Response Time */}
          <div className="chart-card">
            <h3 className="chart-title">
              <SpeedRoundedIcon sx={{ color: '#4facfe' }} />
              Response Latency (ms)
            </h3>
            {data.latencyData.length > 0 ? (
              <Box height={300}>
                <LineChart
                  xAxis={[{ data: data.latencyData.map((_, i) => i + 1), scaleType: 'point' }]}
                  series={[{ data: data.latencyData.map(d => d.value), color: '#4facfe', area: true }]}
                  height={300}
                  margin={{ left: 60, right: 20, top: 20, bottom: 40 }}
                />
              </Box>
            ) : <EmptyState message="No queries processed yet" />}
          </div>

          {/* 3. Chunk Distribution */}
          <div className="chart-card">
            <h3 className="chart-title">
              <HubRoundedIcon sx={{ color: '#764ba2' }} />
              Chunk Distribution per Doc
            </h3>
            {data.chunkData.length > 0 ? (
              <Box height={300}>
                <BarChart
                  xAxis={[{ data: data.chunkData.map(d => d.name.slice(0, 8) + '...'), scaleType: 'band' }]}
                  series={[{ data: data.chunkData.map(d => d.count), color: '#764ba2' }]}
                  height={300}
                  margin={{ left: 60, right: 20, top: 20, bottom: 60 }}
                />
              </Box>
            ) : <EmptyState message="No chunking data available" />}
          </div>

          {/* 4. Similarity Scores */}
          <div className="chart-card">
            <h3 className="chart-title">
              <VerifiedUserRoundedIcon sx={{ color: '#00e5cc' }} />
              Similarity Confidence (Last Query)
            </h3>
            {data.similarityData.length > 0 ? (
              <Box height={300}>
                <BarChart
                  xAxis={[{ data: data.similarityData.map(d => d.label), scaleType: 'band' }]}
                  series={[{ data: data.similarityData.map(d => d.score), color: '#00e5cc' }]}
                  height={300}
                  margin={{ left: 60, right: 20, top: 20, bottom: 40 }}
                />
              </Box>
            ) : <EmptyState message="Run a query to see confidence scores" />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

