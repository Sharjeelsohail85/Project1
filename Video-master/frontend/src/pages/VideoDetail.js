import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { authAPI, commentAPI, getApiErrorMessage, videoAPI } from '../services/api';

const VideoDetail = () => {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadVideo = useCallback(async (isMounted, videoId) => {
    try {
      if (!isMounted.current) return;
      setLoading(true);
      setError('');

      const response = await videoAPI.getById(videoId);
      const videoData = response?.data || null;

      if (!isMounted.current) return;
      setVideo(videoData);
    } catch (err) {
      if (!isMounted.current) return;
      setError(getApiErrorMessage(err, 'Failed to load video'));
      setVideo(null);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const loadComments = useCallback(async (isMounted, videoId) => {
    try {
      const response = await commentAPI.getByVideo(videoId);
      const items = Array.isArray(response?.data) ? response.data : [];

      if (!isMounted.current) return;
      setComments(items);
    } catch {
      if (!isMounted.current) return;
      setComments([]);
    }
  }, []);

  useEffect(() => {
    const isMounted = { current: true };
    setIsAuthenticated(authAPI.isAuthenticated());
    loadVideo(isMounted, id);
    loadComments(isMounted, id);

    return () => {
      isMounted.current = false;
    };
  }, [id, loadComments, loadVideo]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      setError('Please login to like videos');
      return;
    }
    try {
      await videoAPI.like(id);
      const isMounted = { current: true };
      await loadVideo(isMounted, id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to like video'));
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) {
      setError('Please login to dislike videos');
      return;
    }
    try {
      await videoAPI.dislike(id);
      const isMounted = { current: true };
      await loadVideo(isMounted, id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to dislike video'));
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please login to comment');
      return;
    }
    if (!commentText.trim()) return;

    try {
      await commentAPI.create(id, { comment: commentText });
      setCommentText('');
      const isMounted = { current: true };
      await loadComments(isMounted, id);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to post comment'));
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !video) {
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

      {video && (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Box
              component="video"
              controls
              src={video.embed || video.url}
              sx={{ width: '100%', maxHeight: '600px', mb: 2 }}
            />
            <Typography variant="h4" component="h1" gutterBottom>
              {video.title || 'Untitled Video'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {video.description || 'No description'}
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <IconButton
                color="primary"
                onClick={handleLike}
                disabled={!isAuthenticated}
              >
                <ThumbUpIcon />
              </IconButton>
              <Typography variant="body2">
                {video.likes_count || 0} likes
              </Typography>
              <IconButton
                color="secondary"
                onClick={handleDislike}
                disabled={!isAuthenticated}
              >
                <ThumbDownIcon />
              </IconButton>
            </Box>
          </Paper>

          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Comments
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {isAuthenticated && (
              <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <IconButton type="submit" color="primary">
                        <SendIcon />
                      </IconButton>
                    ),
                  }}
                />
              </Box>
            )}

            <List>
              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No comments yet. Be the first to comment!
                </Typography>
              ) : (
                comments.map((comment) => (
                  <React.Fragment key={comment.uuid || comment.id}>
                    <ListItem>
                      <ListItemText
                        primary={comment.comment || comment.text}
                        secondary={comment.user?.name || 'Anonymous'}
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default VideoDetail;
