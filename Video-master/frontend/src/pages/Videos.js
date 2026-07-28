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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, videoAPI } from '../services/api';

const Videos = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadVideos = useCallback(async (isMounted) => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      setError('');

      const response = await videoAPI.getAll();
      const items = Array.isArray(response?.data) ? response.data : [];

      if (!isMounted.current) return;
      setVideos(items);
    } catch (err) {
      if (!isMounted.current) return;
      setError(getApiErrorMessage(err, 'Failed to load videos'));
      setVideos([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const isMounted = { current: true };
    loadVideos(isMounted);

    return () => {
      isMounted.current = false;
    };
  }, [loadVideos]);

  const handleVideoClick = (videoId) => {
    navigate(`/videos/${videoId}`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        All Videos
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
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
                No videos found
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
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Videos;
