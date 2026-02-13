import React, { useState, useEffect } from 'react';
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
import { channelAPI, videoAPI, authAPI } from '../services/api';

const ChannelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authAPI.isAuthenticated());
    loadChannel();
    loadChannelVideos();
  }, [id]);

  const loadChannel = async () => {
    try {
      setLoading(true);
      const response = await channelAPI.getById(id);
      if (response.data) {
        setChannel(response.data);
      }
    } catch (err) {
      setError('Failed to load channel');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadChannelVideos = async () => {
    try {
      const response = await videoAPI.getAll();
      if (response.data) {
        // Filter videos by channel if needed
        const channelVideos = Array.isArray(response.data)
          ? response.data.filter((v) => v.channel_id === id || v.channel?.uuid === id)
          : [];
        setVideos(channelVideos);
      }
    } catch (err) {
      console.error('Failed to load channel videos:', err);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      setError('Please login to subscribe');
      return;
    }
    try {
      await channelAPI.subscribe(id);
      setIsSubscribed(true);
    } catch (err) {
      setError('Failed to subscribe');
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await channelAPI.unsubscribe(id);
      setIsSubscribed(false);
    } catch (err) {
      setError('Failed to unsubscribe');
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
