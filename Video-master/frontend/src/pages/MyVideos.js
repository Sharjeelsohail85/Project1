import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CircularProgress,
  Alert,
  Button,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, videoAPI } from '../services/api';

const MyVideos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMyVideos = useCallback(async (isMounted) => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      setError('');

      const response = await videoAPI.getMyVideos();
      const items = Array.isArray(response?.data) ? response.data : [];

      if (!isMounted.current) return;
      setVideos(items);
    } catch (err) {
      if (!isMounted.current) return;
      setError(getApiErrorMessage(err, 'Failed to load your videos'));
      setVideos([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const isMounted = { current: true };
    loadMyVideos(isMounted);

    return () => {
      isMounted.current = false;
    };
  }, [loadMyVideos]);

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await videoAPI.delete(videoId);
      const isMounted = { current: true };
      await loadMyVideos(isMounted);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to delete video'));
    }
  };

  const handleVideoClick = (videoId) => {
    navigate(`/videos/${videoId}`);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          My Videos
        </Typography>
        <Button variant="contained" color="primary">
          Upload Video
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {videos.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="h6" align="center" color="text.secondary">
                You haven't uploaded any videos yet
              </Typography>
            </Grid>
          ) : (
            videos.map((video) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={video.uuid || video.id}>
                <Card>
                  <CardActionArea onClick={() => handleVideoClick(video.uuid || video.id)}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={video.thumbnail || '/placeholder-video.jpg'}
                      alt={video.title || 'Video'}
                    />
                    <CardContent>
                      <Typography variant="h6" component="h2" noWrap>
                        {video.title || 'Untitled Video'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {video.description || 'No description'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                  <Box display="flex" justifyContent="flex-end" p={1}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(video.uuid || video.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default MyVideos;
