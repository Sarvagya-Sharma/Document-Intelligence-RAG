import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './components/Home'
import Chat from './components/Chat'
import About from './components/About'
import Analytics from './components/Analytics'
import './App.css'

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </BrowserRouter>
  )
};

export default App