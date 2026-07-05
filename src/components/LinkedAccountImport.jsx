import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import {
  getConnectedAccounts,
  connectAccount,
  disconnectAccount,
  fetchVideosFromAccount,
  saveConnectedAccounts,
} from "../services/linkedAccountService";
import { saveLocalChannelVideo } from "../services/videoService";

const PROVIDER_META = {
  google: { icon: "cloud_queue", label: "Google Drive", color: "#4285F4" },
  facebook: { icon: "facebook", label: "Facebook", color: "#1877F2" },
  dropbox: { icon: "folder_shared", label: "Dropbox", color: "#0061FF" },
};

const LinkedAccountImport = memo(function LinkedAccountImport({
  onSelectVideo,
  onError,
}) {
  const [accounts, setAccounts] = useState(() => getConnectedAccounts());
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [videos, setVideos] = useState([]);
  const [fetchingVideos, setFetchingVideos] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [videoError, setVideoError] = useState("");
  const [showDropboxManual, setShowDropboxManual] = useState(false);
  const [dropboxManualToken, setDropboxManualToken] = useState("");

  const refreshAccounts = useCallback(() => {
    setAccounts(getConnectedAccounts());
  }, []);

  const handleConnect = useCallback(
    async (provider) => {
      setLoadingProvider(provider);
      try {
        await connectAccount(provider);
        refreshAccounts();
      } catch (err) {
        onError?.(err.message || `Failed to connect ${provider}`);
      } finally {
        setLoadingProvider(null);
      }
    },
    [onError, refreshAccounts],
  );

  const handleDisconnect = useCallback(
    (provider) => {
      disconnectAccount(provider);
      refreshAccounts();
      if (selectedProvider === provider) {
        setSelectedProvider(null);
        setVideos([]);
      }
    },
    [refreshAccounts, selectedProvider],
  );

  const handleBrowseVideos = useCallback(async (provider) => {
    setSelectedProvider(provider);
    setFetchingVideos(true);
    setVideoError("");
    try {
      const result = await fetchVideosFromAccount(provider);
      setVideos(result?.videos || []);
      if (!result?.videos?.length) {
        setVideoError("No videos found on this account.");
      }
    } catch (err) {
      setVideoError(err.message || "Failed to fetch videos.");
      setVideos([]);
    } finally {
      setFetchingVideos(false);
    }
  }, []);

  const handleSelectVideo = useCallback(
    (video) => {
      const importedVideo = {
        uuid: video.id,
        id: video.id,
        title: video.title,
        name: video.title,
        type:
          selectedProvider === "google"
            ? "Google Drive"
            : selectedProvider === "facebook"
              ? "Facebook"
              : selectedProvider === "dropbox"
                ? "Dropbox"
                : "Direct Link",
        source_url: video.url,
        video_url: video.url,
        description: video.description || "",
        privacy_option: "public",
        channel_name: "My Channel",
        created_at: video.publishedAt || new Date().toISOString(),
      };
      saveLocalChannelVideo(importedVideo);

      onSelectVideo?.({
        sourceType:
          selectedProvider === "google"
            ? "uploadGoogle"
            : selectedProvider === "facebook"
              ? "uploadFacebook"
              : selectedProvider === "dropbox"
                ? "uploadDropbox"
                : "uploadLink",
        sourceUrl: video.url,
        title: video.title,
      });
    },
    [onSelectVideo, selectedProvider],
  );

  const connectedProviders = useMemo(
    () => accounts.filter((a) => a.connected).map((a) => a.provider),
    [accounts],
  );

  const availableProviders = useMemo(
    () =>
      Object.keys(PROVIDER_META).filter((p) => !connectedProviders.includes(p)),
    [connectedProviders],
  );

  return (
    <div className="linked-account-import">
      <h3 className="linked-account-title">Linked Accounts</h3>
      <p className="linked-account-desc">
        Connect your accounts to import videos you already own.
      </p>

      {/* Connected accounts */}
      {connectedProviders.length > 0 && (
        <div className="linked-account-section">
          <h4 className="linked-account-section-title">Connected</h4>
          {connectedProviders.map((provider) => {
            const meta = PROVIDER_META[provider] || {
              icon: "link",
              label: provider,
              color: "#888",
            };
            return (
              <div key={provider} className="linked-account-item">
                <div className="linked-account-item-left">
                  <i
                    className="material-icons linked-account-icon"
                    style={{ color: meta.color }}
                    aria-hidden="true"
                  >
                    {meta.icon}
                  </i>
                  <span className="linked-account-name">{meta.label}</span>
                  <span className="linked-account-badge connected">
                    Connected
                  </span>
                </div>
                <div className="linked-account-item-actions">
                  <Button
                    className="linked-account-btn browse-btn"
                    onClick={() => handleBrowseVideos(provider)}
                    disabled={fetchingVideos && selectedProvider === provider}
                    variant="text"
                    color="inherit"
                    disableElevation
                    disableRipple
                    sx={{
                      minWidth: 0,
                      padding: "6px 14px",
                      textTransform: "none",
                      color: "#fafafa",
                      fontSize: "0.85rem",
                    }}
                  >
                    {fetchingVideos && selectedProvider === provider
                      ? "Loading..."
                      : "Browse Videos"}
                  </Button>
                  <Button
                    className="linked-account-btn disconnect-btn"
                    onClick={() => handleDisconnect(provider)}
                    variant="text"
                    color="inherit"
                    disableElevation
                    disableRipple
                    sx={{
                      minWidth: 0,
                      padding: "6px 10px",
                      textTransform: "none",
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.8rem",
                    }}
                  >
                    <i className="material-icons" style={{ fontSize: 18 }}>
                      link_off
                    </i>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Available accounts to connect */}
      {availableProviders.length > 0 && (
        <div className="linked-account-section">
          <h4 className="linked-account-section-title">Available</h4>
          {availableProviders.map((provider) => {
            const meta = PROVIDER_META[provider] || {
              icon: "link",
              label: provider,
              color: "#888",
            };
            const isLoading = loadingProvider === provider;
            return (
              <div key={provider} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                <div className="linked-account-item" style={{ marginBottom: 0 }}>
                  <div className="linked-account-item-left">
                    <i
                      className="material-icons linked-account-icon"
                      style={{ color: meta.color }}
                      aria-hidden="true"
                    >
                      {meta.icon}
                    </i>
                    <span className="linked-account-name">{meta.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {provider === 'dropbox' && (
                      <Button
                        onClick={() => setShowDropboxManual(prev => !prev)}
                        variant="text"
                        color="inherit"
                        sx={{
                          minWidth: 0,
                          padding: "4px 8px",
                          textTransform: "none",
                          color: "rgba(255,255,255,0.7)",
                          fontSize: "0.75rem",
                          border: '1px solid rgba(255,255,255,0.1)'
                        }}
                      >
                        {showDropboxManual ? "Cancel" : "Use Token"}
                      </Button>
                    )}
                    <Button
                      className="linked-account-btn connect-btn"
                      onClick={() => handleConnect(provider)}
                      disabled={isLoading}
                      variant="text"
                      color="inherit"
                      disableElevation
                      disableRipple
                      sx={{
                        minWidth: 0,
                        padding: "6px 14px",
                        textTransform: "none",
                        color: "#03DAC6",
                        fontSize: "0.85rem",
                      }}
                    >
                      {isLoading ? "Connecting..." : "Connect"}
                    </Button>
                  </div>
                </div>
                {provider === 'dropbox' && showDropboxManual && (
                  <div style={{
                    padding: '12px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0, color: 'rgba(255,255,255,0.7)' }}>
                      Enter your Dropbox <strong>Personal Access Token</strong> (generated from Dropbox App Console) to connect directly:
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="password"
                        placeholder="Paste Dropbox token..."
                        value={dropboxManualToken}
                        onChange={(e) => setDropboxManualToken(e.target.value)}
                        style={{
                          flex: 1,
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '4px',
                          color: '#fff',
                          padding: '6px 10px',
                          fontSize: '0.8rem'
                        }}
                      />
                      <Button
                        variant="text"
                        onClick={() => {
                          if (!dropboxManualToken.trim()) {
                            onError?.("Please enter a valid token.");
                            return;
                          }
                          try {
                            const accounts = getConnectedAccounts();
                            const newAccount = {
                              provider: 'dropbox',
                              connected: true,
                              user: {
                                uuid: `dropbox-user-manual-${Date.now()}`,
                                first_name: 'Dropbox',
                                last_name: 'User (Manual)',
                                email: `dropbox.${Date.now()}@manual.local`,
                                registration_type: 'dropbox',
                                active: 1,
                                dropbox_access_token: dropboxManualToken.trim(),
                                access_token: dropboxManualToken.trim(),
                              }
                            };
                            const filtered = accounts.filter(a => a.provider !== 'dropbox');
                            filtered.push(newAccount);
                            saveConnectedAccounts(filtered);
                            refreshAccounts();
                            setDropboxManualToken('');
                            setShowDropboxManual(false);
                          } catch (err) {
                            onError?.("Failed to save token: " + err.message);
                          }
                        }}
                        sx={{
                          textTransform: 'none',
                          color: '#03DAC6',
                          fontSize: '0.8rem',
                          border: '1px solid rgba(3, 218, 198, 0.3)',
                          padding: '4px 10px'
                        }}
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Video list from selected provider */}
      {selectedProvider && (
        <div className="linked-account-videos">
          <h4 className="linked-account-section-title">
            Videos from{" "}
            {PROVIDER_META[selectedProvider]?.label || selectedProvider}
          </h4>

          {fetchingVideos && (
            <div className="linked-account-loading">
              <div className="linked-account-spinner" />
              <span>Loading videos...</span>
            </div>
          )}

          {videoError && !fetchingVideos && (
            <Typography
              variant="body2"
              sx={{
                color: "rgba(255,255,255,0.7)",
                textAlign: "center",
                py: 2,
              }}
            >
              {videoError}
            </Typography>
          )}

          {!fetchingVideos && !videoError && videos.length > 0 && (
            <div className="linked-account-video-list">
              {videos.map((video) => (
                <div key={video.id} className="linked-account-video-card">
                  <div className="linked-account-video-thumb">
                    {video.thumbnail ? (
                      <img src={video.thumbnail} alt={video.title} />
                    ) : (
                      <i
                        className="material-icons"
                        style={{ fontSize: 36, opacity: 0.5 }}
                      >
                        play_circle_outline
                      </i>
                    )}
                  </div>
                  <div className="linked-account-video-info">
                    <span className="linked-account-video-title">
                      {video.title}
                    </span>
                    <span className="linked-account-video-meta">
                      {video.duration ? `${video.duration}` : ""}
                      {video.publishedAt ? ` • ${video.publishedAt}` : ""}
                    </span>
                  </div>
                  <Button
                    className="linked-account-btn import-btn"
                    onClick={() => handleSelectVideo(video)}
                    variant="text"
                    color="inherit"
                    disableElevation
                    disableRipple
                    sx={{
                      minWidth: 0,
                      padding: "6px 14px",
                      textTransform: "none",
                      color: "#03DAC6",
                      fontSize: "0.85rem",
                      flexShrink: 0,
                    }}
                  >
                    Import
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default LinkedAccountImport;
