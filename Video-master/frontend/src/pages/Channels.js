import React, { useState, useEffect } from 'react';
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
import { channelAPI } from '../services/api';

const Channels = () => {
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      setLoading(true);
      const response = await channelAPI.getAll();
      if (response.data) {
        setChannels(Array.isArray(response.data) ? response.data : []);
      }
    } catch (err) {
      setError('Failed to load channels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
