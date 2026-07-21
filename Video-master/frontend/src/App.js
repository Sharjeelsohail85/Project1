import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { authAPI } from './services/api';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Videos from './pages/Videos';
import VideoDetail from './pages/VideoDetail';
import Channels from './pages/Channels';
import ChannelDetail from './pages/ChannelDetail';
import Profile from './pages/Profile';
import MyVideos from './pages/MyVideos';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  if (!authAPI.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/videos"
        element={
          <Layout>
            <Videos />
          </Layout>
        }
      />
      <Route
        path="/videos/:id"
        element={
          <Layout>
            <VideoDetail />
          </Layout>
        }
      />
      <Route
        path="/my-videos"
        element={
          <Layout>
            <ProtectedRoute>
              <MyVideos />
            </ProtectedRoute>
          </Layout>
        }
      />
      <Route
        path="/channels"
        element={
          <Layout>
            <Channels />
          </Layout>
        }
      />
      <Route
        path="/channels/:id"
        element={
          <Layout>
            <ChannelDetail />
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </Layout>
        }
      />
    </Routes>
  );
}

export default App;
