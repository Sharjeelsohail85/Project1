import { memo, useState } from 'react'

const PROVIDERS = {
  link: 'Link to a Video',
  youtube: 'Link to a YouTube Video',
  facebook: 'Link to a Facebook Post',
  drive: 'Link to a Google Drive Video',
  dropbox: 'Link to a Dropbox Video'
}

const PostPage = memo(function PostPage({ onClose }) {
  const [provider, setProvider] = useState(null)

  const showSourceGrid = !provider

  return (
    <section id="postPage" className="post-page" aria-label="Post content">
      <button
        className="post-page-close button-float active"
        onClick={() => onClose?.()}
        aria-label="Close post page"
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </button>

      <div className="post-page-panel">
        <h1 className="post-page-title">Post a Video</h1>
        <p className="post-page-description">
          [SiteName] doesn&apos;t host videos directly. You can link to a video, or pick one from a cloud
          hosting service.
        </p>

        <div className={`post-page-link-bar ${provider ? 'active' : ''}`}>
          <button
            type="button"
            className={`material-icons post-page-link-back ${provider ? 'active' : ''}`}
            onClick={() => setProvider(null)}
            aria-label="Back to providers"
          >
            arrow_back
          </button>
          <div className="post-page-link-wrap">
            <i className="material-icons post-page-link-icon" aria-hidden="true">link</i>
            <input
              className="post-page-link-input input"
              placeholder={provider ? PROVIDERS[provider] : 'Link to a Video'}
              type="url"
              aria-label="Video URL"
            />
            <button type="button" className="material-icons post-page-link-go" aria-label="Submit video link">
              arrow_forward
            </button>
          </div>
        </div>

        <div
          className={`post-page-actions ${showSourceGrid ? '' : 'hidden'}`}
          role="group"
          aria-label="Post providers"
        >
          <button className="upload-item-select" id="uploadLink" aria-label="Paste a link" onClick={() => setProvider('link')}>
            <i className="material-icons" aria-hidden="true">insert_link</i>
          </button>
          <button className="upload-item-select" id="uploadYoutube" aria-label="YouTube" onClick={() => setProvider('youtube')}>
            <i className="zmdi zmdi-youtube-play" aria-hidden="true" />
          </button>
          <button className="upload-item-select" id="uploadFacebook" aria-label="Facebook" onClick={() => setProvider('facebook')}>
            <i className="zmdi zmdi-facebook" aria-hidden="true" />
          </button>
          <button className="upload-item-select" id="uploadDrive" aria-label="Google Drive" onClick={() => setProvider('drive')}>
            <i className="zmdi zmdi-google-drive" aria-hidden="true" />
          </button>
          <button className="upload-item-select" id="uploadDropbox" aria-label="Dropbox" onClick={() => setProvider('dropbox')}>
            <i className="zmdi zmdi-dropbox" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
})

export default PostPage




