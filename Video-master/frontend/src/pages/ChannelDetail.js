import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { authAPI, channelAPI, getApiErrorMessage, videoAPI } from '../services/api';

const ChannelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const loadChannel = useCallback(async (isMounted, channelId) => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      setError('');

      const response = await channelAPI.getById(channelId);
      const channelData = response?.data || null;

      if (!isMounted.current) return;
      setChannel(channelData);
    } catch (err) {
      if (!isMounted.current) return;
      setError(getApiErrorMessage(err, 'Failed to load channel'));
      setChannel(null);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadChannelVideos = useCallback(async (isMounted, channelId) => {
    try {
      const response = await videoAPI.getAll();
      const channelVideos = Array.isArray(response?.data)
        ? response.data.filter((v) => v.channel_id === channelId || v.channel?.uuid === channelId)
        : [];

      if (!isMounted.current) return;
      setVideos(channelVideos);
    } catch {
      if (!isMounted.current) return;
      setVideos([]);
    }
  }, []);

  useEffect(() => {
    const isMounted = { current: true };
    setIsAuthenticated(authAPI.isAuthenticated());
    loadChannel(isMounted, id);
    loadChannelVideos(isMounted, id);

    return () => {
      isMounted.current = false;
    };
  }, [id, loadChannel, loadChannelVideos]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setError('Please login to subscribe');
      return;
    }
    try {
      await channelAPI.subscribe(id);
      setIsSubscribed(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to subscribe'));
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await channelAPI.unsubscribe(id);
      setIsSubscribed(false);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to unsubscribe'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !channel) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {channel && (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box display="flex" gap={3} alignItems="center" mb={2}>
              {channel.thumbnail && (
                <Box
                  component="img"
                  src={channel.thumbnail}
                  alt={channel.name}
                  sx={{ width: 150, height: 150, borderRadius: 2 }}
                />
              )}
              <Box flex={1}>
                <Typography variant="h4" component="h1" gutterBottom>
                  {channel.name || 'Untitled Channel'}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {channel.description || 'No description'}
                </Typography>
                {isAuthenticated && (
                  <Button
                    variant={isSubscribed ? 'outlined' : 'contained'}
                    onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
                  >
                    {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>

          <Typography variant="h5" gutterBottom>
            Videos
          </Typography>

          <Grid container spacing={3}>
            {videos.length === 0 ? (
              <Grid item xs={12}>
                <Typography variant="body1" color="text.secondary" align="center">
                  No videos in this channel
                </Typography>
              </Grid>
            ) : (
              videos.map((video) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={video.uuid || video.id}>
                  <Card>
                    <CardActionArea onClick={() => navigate(`/videos/${video.uuid || video.id}`)}>
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
        </>
      )}
    </Box>
  );
};

export default ChannelDetail;
