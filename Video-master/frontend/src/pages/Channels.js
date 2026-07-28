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
import { channelAPI, getApiErrorMessage } from '../services/api';

const Channels = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChannels = useCallback(async (isMounted) => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      setError('');

      const response = await channelAPI.getAll();
      const items = Array.isArray(response?.data) ? response.data : [];

      if (!isMounted.current) return;
      setChannels(items);
    } catch (err) {
      if (!isMounted.current) return;
      setError(getApiErrorMessage(err, 'Failed to load channels'));
      setChannels([]);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const isMounted = { current: true };
    loadChannels(isMounted);

    return () => {
      isMounted.current = false;
    };
  }, [loadChannels]);

  const handleChannelClick = (channelId) => {
    navigate(`/channels/${channelId}`);
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        All Channels
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
          {channels.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="h6" align="center" color="text.secondary">
                No channels found
              </Typography>
            </Grid>
          ) : (
            channels.map((channel) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={channel.uuid || channel.id}>
                <Card>
                  <CardActionArea onClick={() => handleChannelClick(channel.uuid || channel.id)}>
                    <CardMedia
                      component="img"
                      height="200"
                      image={channel.thumbnail || '/placeholder-channel.jpg'}
                      alt={channel.name || 'Channel'}
                    />
                    <CardContent>
                      <Typography variant="h6" component="h2" noWrap>
                        {channel.name || 'Untitled Channel'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {channel.description || 'No description'}
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

export default Channels;
