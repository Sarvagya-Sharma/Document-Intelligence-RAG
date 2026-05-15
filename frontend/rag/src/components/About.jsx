import { useEffect, useState } from "react";
import "./About.css";
import Navbar from "./Navbar";
import { Card, CardContent, Typography, Avatar, Box, Grid } from '@mui/material';

const reviews = [
  {
    name: "Alex",
    title: "Senior Researcher",
    review: "InstaDocs has completely transformed my workflow. Being able to query long documents and get instant, accurate summaries is like having an assistant 24/7.",
    avatar: "AL",
    color: "#ff8e53"
  },
  {
    name: "Saket",
    title: "Consultant",
    review: "The citation feature what sets this apart. It doesn't just give answers; it tells me exactly where in the document it found the information. Absolute game-changer for due diligence.",
    avatar: "SA",
    color: "#ff8e53"
  },
  {
    name: "Abhishek",
    title: "Data Scientist",
    review: "As someone who builds RAG systems, I'm impressed by the latency and relevance here. The semantic search captures nuances that standard search engines miss entirely.",
    avatar: "AB",
    color: "#ff8e53"
  }
];

const features = [
  {
    title: "Deep Semantic Search",
    description: "Our RAG engine goes beyond simple keyword matching. It understands intent and context to find hidden insights."
  },
  {
    title: "Real-time Intelligence",
    description: "Instant document processing. No wait times—just immediate intelligence at your fingertips."
  },
  {
    title: "Fact-Grounded Responses",
    description: "Strictly grounded in your data to eliminate AI hallucinations and ensure verifiable accuracy."
  }
];

export default function About() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className={`about-page ${mounted ? "about-page--visible" : ""}`}>
      <Navbar />

      {/* Background elements to match Home */}
      <div className="overlay-gradient" />
      <div className="overlay-vignette" />
      <div className="stars-layer" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <span key={i} className="star" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 80}%`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
            width: `${1 + Math.random() * 2}px`,
            height: `${1 + Math.random() * 2}px`,
          }} />
        ))}
      </div>

      <div className="about-hero-content">
        <div className="about-header-group">
          <p className="about-label-new">Intelligence Redefined</p>
          <h1 className="about-title-new">Empowering Human Knowledge</h1>
          <p className="about-subtitle-new">
            InstaDocs is a state-of-the-art RAG platform designed to bridge the gap between static data and active knowledge.
          </p>
        </div>

        <div className="features-container-new">
          {features.map((feature, index) => (
            <div key={index} className="feature-card-new">
              <h3 className="feature-title-new">{feature.title}</h3>
              <p className="feature-desc-new">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="reviews-container-new">
          <h2 className="reviews-title-new">User Feedback</h2>
          <Grid container spacing={3} justifyContent="center">
            {reviews.map((rev, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card className="review-card-mui-new">
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar sx={{ bgcolor: rev.color, mr: 2, fontWeight: 'bold' }}>{rev.avatar}</Avatar>
                      <Box>
                        <Typography variant="subtitle1" component="div" sx={{ color: '#fff', fontWeight: 600 }}>
                          {rev.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 142, 83, 0.7)' }}>
                          {rev.title}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', fontStyle: 'italic', lineHeight: 1.6 }}>
                      "{rev.review}"
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>
      </div>
    </section>
  );
}
