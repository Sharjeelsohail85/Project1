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
import { resolveDropboxStreamLink } from "../services/dropboxUploadService";
import CircularProgress from "@mui/material/CircularProgress";

const PROVIDER_META = {
  google: { icon: "cloud_queue", label: "Google Drive", color: "#4285F4" },
  facebook: { icon: "facebook", label: "Facebook", color: "#1877F2" },
  dropbox: { icon: "folder_shared", label: "Dropbox", color: "#0061FF" },
  onedrive: { icon: "cloud_done", label: "Microsoft OneDrive", color: "#0078d4" },
};

const LinkedAccountImport = memo(function LinkedAccountImport({
  onSelectVideo,
  onError,
  singleProvider = null,
}) {
  const [accounts, setAccounts] = useState(() => getConnectedAccounts());
  const [loadingProvider, setLoadingProvider] = useState(null);
  const [videos, setVideos] = useState([]);
  const [fetchingVideos, setFetchingVideos] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [videoError, setVideoError] = useState("");
  const [showDropboxManual, setShowDropboxManual] = useState(false);
  const [dropboxManualToken, setDropboxManualToken] = useState("");
  const [showGoogleManual, setShowGoogleManual] = useState(false);
  const [googleManualToken, setGoogleManualToken] = useState("");
  const [showOneDriveManual, setShowOneDriveManual] = useState(false);
  const [onedriveManualToken, setOnedriveManualToken] = useState("");
  const [onedriveSubTab, setOnedriveSubTab] = useState("token"); // 'token' or 'config'
  const [customOneDriveClientId, setCustomOneDriveClientId] = useState(() => {
    try {
      return localStorage.getItem("custom_onedrive_client_id") || "";
    } catch {
      return "";
    }
  });
  const [resolvingVideoId, setResolvingVideoId] = useState(null);

  const refreshAccounts = useCallback(() => {
    setAccounts(getConnectedAccounts());
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const handleConnect = useCallback(
    async (provider) => {
      setLoadingProvider(provider);
      try {
        if (provider === 'onedrive') {
          const { connectOneDriveWithImplicitToken } = await import("../services/onedriveService");
          await connectOneDriveWithImplicitToken();
        } else {
          await connectAccount(provider);
        }
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
    async (video) => {
      let resolvedUrl = video.url;

      if (selectedProvider === "dropbox") {
        setResolvingVideoId(video.id);
        try {
          const dropboxAccount = accounts.find((a) => a.provider === "dropbox");
          const token = dropboxAccount?.user?.dropbox_access_token
            || dropboxAccount?.user?.access_token
            || "";
          
          if (!token) {
            throw new Error("Dropbox account is not connected or token is missing.");
          }

          console.log(`Resolving direct stream URL for Dropbox video: ${video.path}`);
          resolvedUrl = await resolveDropboxStreamLink(video.path, token);
          console.log(`Successfully resolved stream URL: ${resolvedUrl}`);
        } catch (err) {
          console.error("Failed to resolve Dropbox stream URL:", err);
          onError?.(err.message || "Failed to resolve stream link for Dropbox video.");
          setResolvingVideoId(null);
          return;
        } finally {
          setResolvingVideoId(null);
        }
      }

      if (selectedProvider === "onedrive") {
        setResolvingVideoId(video.id);
        try {
          const onedriveAccount = accounts.find((a) => a.provider === "onedrive");
          const token = onedriveAccount?.user?.onedrive_access_token
            || onedriveAccount?.user?.access_token
            || "";
          
          if (!token) {
            throw new Error("OneDrive account is not connected or token is missing.");
          }

          console.log(`Resolving direct stream URL for OneDrive video: ${video.id}`);
          const { resolveOneDriveStreamLink } = await import("../services/onedriveService");
          resolvedUrl = await resolveOneDriveStreamLink(video.id, token);
          console.log(`Successfully resolved OneDrive stream URL: ${resolvedUrl}`);
        } catch (err) {
          console.error("Failed to resolve OneDrive stream URL:", err);
          onError?.(err.message || "Failed to resolve stream link for OneDrive video.");
          setResolvingVideoId(null);
          return;
        } finally {
          setResolvingVideoId(null);
        }
      }

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
                : selectedProvider === "onedrive"
                  ? "Microsoft OneDrive"
                  : "Direct Link",
        source_url: resolvedUrl,
        video_url: resolvedUrl,
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
                : selectedProvider === "onedrive"
                  ? "uploadOneDrive"
                  : "uploadLink",
        sourceUrl: resolvedUrl,
        title: video.title,
      });
    },
    [onSelectVideo, selectedProvider, accounts, onError],
  );

  const connectedProviders = useMemo(
    () => accounts.filter((a) => a.connected && (!singleProvider || a.provider === singleProvider)).map((a) => a.provider),
    [accounts, singleProvider],
  );

  const availableProviders = useMemo(
    () =>
      Object.keys(PROVIDER_META)
        .filter((p) => !connectedProviders.includes(p) && (!singleProvider || p === singleProvider)),
    [connectedProviders, singleProvider],
  );

  useEffect(() => {
    if (singleProvider && connectedProviders.includes(singleProvider) && selectedProvider !== singleProvider) {
      handleBrowseVideos(singleProvider);
    }
  }, [singleProvider, connectedProviders, selectedProvider, handleBrowseVideos]);

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
                    {(provider === 'dropbox' || provider === 'google' || provider === 'onedrive') && (
                      <Button
                        onClick={() => {
                          if (provider === 'google') {
                            setShowGoogleManual(prev => !prev);
                          } else if (provider === 'dropbox') {
                            setShowDropboxManual(prev => !prev);
                          } else if (provider === 'onedrive') {
                            setShowOneDriveManual(prev => !prev);
                          }
                        }}
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
                        {(provider === 'google' ? showGoogleManual : provider === 'dropbox' ? showDropboxManual : showOneDriveManual) ? "Cancel" : "Use Token"}
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

                {provider === 'google' && showGoogleManual && (
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
                      Enter your Google Drive <strong>Access Token</strong> to connect directly:
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="password"
                        placeholder="Paste Google Drive token..."
                        value={googleManualToken}
                        onChange={(e) => setGoogleManualToken(e.target.value)}
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
                          if (!googleManualToken.trim()) {
                            onError?.("Please enter a valid token.");
                            return;
                          }
                          try {
                            const accounts = getConnectedAccounts();
                            const newAccount = {
                              provider: 'google',
                              connected: true,
                              user: {
                                uuid: `google-user-manual-${Date.now()}`,
                                first_name: 'Google',
                                last_name: 'Drive (Manual)',
                                email: `google.${Date.now()}@manual.local`,
                                registration_type: 'google',
                                active: 1,
                                google_access_token: googleManualToken.trim(),
                                access_token: googleManualToken.trim(),
                              }
                            };
                            const filtered = accounts.filter(a => a.provider !== 'google');
                            filtered.push(newAccount);
                            saveConnectedAccounts(filtered);
                            refreshAccounts();
                            setGoogleManualToken('');
                            setShowGoogleManual(false);
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

                {provider === 'onedrive' && showOneDriveManual && (
                  <div style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    {/* Tab Selection */}
                    <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                      <button
                        onClick={() => setOnedriveSubTab('token')}
                        style={{
                          background: onedriveSubTab === 'token' ? 'rgba(3, 218, 198, 0.15)' : 'transparent',
                          border: onedriveSubTab === 'token' ? '1px solid #03DAC6' : '1px solid transparent',
                          color: onedriveSubTab === 'token' ? '#03DAC6' : 'rgba(255,255,255,0.6)',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                      >
                        Option A: Personal Access Token
                      </button>
                      <button
                        onClick={() => setOnedriveSubTab('config')}
                        style={{
                          background: onedriveSubTab === 'config' ? 'rgba(3, 218, 198, 0.15)' : 'transparent',
                          border: onedriveSubTab === 'config' ? '1px solid #03DAC6' : '1px solid transparent',
                          color: onedriveSubTab === 'config' ? '#03DAC6' : 'rgba(255,255,255,0.6)',
                          borderRadius: '4px',
                          padding: '4px 10px',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                      >
                        Option B: Custom Azure Client ID
                      </button>
                    </div>

                    {onedriveSubTab === 'token' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                          Enter your OneDrive <strong>Personal Access Token</strong> (generated from Microsoft Developer Portal / Graph Explorer) to connect directly:
                        </p>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="password"
                            placeholder="Paste OneDrive token..."
                            value={onedriveManualToken}
                            onChange={(e) => setOnedriveManualToken(e.target.value)}
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
                              if (!onedriveManualToken.trim()) {
                                onError?.("Please enter a valid token.");
                                return;
                              }
                              try {
                                const accounts = getConnectedAccounts();
                                const newAccount = {
                                  provider: 'onedrive',
                                  connected: true,
                                  user: {
                                    uuid: `onedrive-user-manual-${Date.now()}`,
                                    first_name: 'OneDrive',
                                    last_name: 'User (Manual)',
                                    email: `onedrive.${Date.now()}@manual.local`,
                                    registration_type: 'onedrive',
                                    active: 1,
                                    onedrive_access_token: onedriveManualToken.trim(),
                                    access_token: onedriveManualToken.trim(),
                                  }
                                };
                                const filtered = accounts.filter(a => a.provider !== 'onedrive');
                                filtered.push(newAccount);
                                saveConnectedAccounts(filtered);
                                refreshAccounts();
                                setOnedriveManualToken('');
                                setShowOneDriveManual(false);
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
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ fontSize: '0.75rem', opacity: 0.8, margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                          Enter your own Microsoft Azure/Entra <strong>Application (client) ID</strong> below. This allows you to perform the standard OneDrive OAuth login:
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Required Redirect URI in your Azure Portal (Set as Single-page application):
                          </span>
                          <code style={{
                            display: 'block',
                            background: 'rgba(0,0,0,0.4)',
                            padding: '6px 10px',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            color: '#81c784',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace'
                          }}>
                            {window.location.origin}/auth/google/callback
                          </code>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input
                            type="text"
                            placeholder="Azure Application Client ID..."
                            value={customOneDriveClientId}
                            onChange={(e) => setCustomOneDriveClientId(e.target.value)}
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
                              if (!customOneDriveClientId.trim()) {
                                onError?.("Please enter a Client ID.");
                                return;
                              }
                              try {
                                localStorage.setItem('custom_onedrive_client_id', customOneDriveClientId.trim());
                                setCustomOneDriveClientId(customOneDriveClientId.trim());
                                refreshAccounts();
                                setShowOneDriveManual(false);
                                onError?.("Azure Client ID saved! Now click the green 'Connect' button to sign in using your custom Azure app registration.");
                              } catch (err) {
                                onError?.("Failed to save client ID: " + err.message);
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
                            Save ID
                          </Button>
                        </div>

                        {customOneDriveClientId && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                              variant="text"
                              onClick={() => {
                                try {
                                  localStorage.removeItem('custom_onedrive_client_id');
                                  setCustomOneDriveClientId('');
                                  refreshAccounts();
                                  onError?.("Azure Client ID cleared. Reverted to default.");
                                } catch (err) {
                                  onError?.("Failed to clear client ID: " + err.message);
                                }
                              }}
                              sx={{
                                textTransform: 'none',
                                color: '#CF6679',
                                fontSize: '0.75rem',
                                padding: '2px 8px'
                              }}
                            >
                              Clear & Reset
                            </Button>
                          </div>
                        )}

                        {/* Azure Step-by-Step Setup Guide */}
                        <div style={{
                          padding: '10px 12px',
                          background: 'rgba(0,0,0,0.2)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.06)',
                          lineHeight: '1.45',
                          marginTop: '4px'
                        }}>
                          <strong style={{ color: '#03DAC6', display: 'block', marginBottom: '6px' }}>
                            🔑 Step-by-Step Microsoft App Setup Guide:
                          </strong>
                          <ol style={{ paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <li>
                              Go to the <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/CreateAppRazorBlade" target="_blank" rel="noreferrer" style={{ color: '#81c784', textDecoration: 'underline' }}>Azure Portal App Registrations</a>.
                            </li>
                            <li>
                              Click <strong>New registration</strong>. Set the name (e.g. <code>Octopussol App</code>).
                            </li>
                            <li>
                              Under <strong>Supported account types</strong>, select: <br />
                              <strong style={{ color: '#ffb74d' }}>"Accounts in any organizational directory (Any Microsoft Entra ID tenant - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)"</strong>.<br />
                              <span style={{ opacity: 0.8 }}>⚠️ <em>Failing to select this causes the "unauthorized_client" error for personal OneDrive accounts.</em></span>
                            </li>
                            <li>
                              Under <strong>Redirect URI</strong>, select <strong style={{ color: '#03DAC6' }}>Single-page application (SPA)</strong> and paste:<br />
                              <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 4px', borderRadius: '3px', color: '#81c784', wordBreak: 'break-all' }}>
                                {window.location.origin}/auth/google/callback
                              </code>
                            </li>
                            <li>
                              Click <strong>Register</strong>, then copy the <strong>Application (client) ID</strong>.
                            </li>
                            <li>
                              In the left menu of your Azure app page, click <strong>Authentication</strong>. Under <strong>Implicit grant and hybrid flows</strong>, check <strong style={{ color: '#03DAC6' }}>Access tokens (used for implicit flows)</strong>.
                            </li>
                            <li>
                              Click <strong>Save</strong> at the top of the Authentication page, paste your copied Client ID in the field above, and click <strong>Save ID</strong>!
                            </li>
                          </ol>
                        </div>
                      </div>
                    )}
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
                    disabled={resolvingVideoId !== null}
                    variant="text"
                    color="inherit"
                    disableElevation
                    disableRipple
                    sx={{
                      minWidth: 0,
                      padding: "6px 14px",
                      textTransform: "none",
                      color: resolvingVideoId === video.id ? "rgba(255,255,255,0.4)" : "#03DAC6",
                      fontSize: "0.85rem",
                      flexShrink: 0,
                    }}
                  >
                    {resolvingVideoId === video.id ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CircularProgress size={12} color="inherit" />
                        Linking...
                      </span>
                    ) : "Import"}
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
