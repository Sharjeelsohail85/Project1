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
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage, videoAPI } from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSearch = async () => {
    const trimmedSearch = searchTerm.trim();

    if (!searchTerm.trim()) {
      const isMounted = { current: true };
      await loadVideos(isMounted);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await videoAPI.search(trimmedSearch, 20);
      setVideos(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to search videos'));
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (videoId) => {
    navigate(`/videos/${videoId}`);
  };

  return (
    <Box>
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Video Master
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Discover and share amazing videos
      </Typography>

      <Box sx={{ mb: 4 }}>
        <TextField
          fullWidth
          placeholder="Search videos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
      </Box>

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

export default Home;
