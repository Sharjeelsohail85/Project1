import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  Grid,
  Avatar,
} from '@mui/material';
import { userAPI } from '../services/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getMe();
      if (response.data) {
        setUser(response.data);
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await userAPI.update(formData);
      if (response.data) {
        setUser(response.data);
        setEditMode(false);
        setError('');
      }
    } catch (err) {
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {user && (
        <Paper elevation={3} sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" alignItems="center">
                <Avatar
                  sx={{ width: 120, height: 120, mb: 2 }}
                  src={user.avatar || user.profile_picture}
                >
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="h5">{user.name || 'User'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user.email}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              {editMode ? (
                <Box component="form" onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Box mt={2} display="flex" gap={2}>
                    <Button type="submit" variant="contained">
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography variant="body1" paragraph>
                    <strong>Name:</strong> {user.name || 'Not set'}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    <strong>Email:</strong> {user.email || 'Not set'}
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => setEditMode(true)}
                    sx={{ mt: 2 }}
                  >
                    Edit Profile
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default Profile;
