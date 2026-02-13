import { memo, useState } from 'react'

const Upload = memo(function Upload({
  active,
  step,
  onHideUpload,
  onNextUpload,
  onPrevUpload
}) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [showFacebookInput, setShowFacebookInput] = useState(false)

  const progressWidth = `${((step - 1) / 2) * 100}%`

  return (
    <section
      id="upload"
      className={`upload ${active ? 'active' : ''}`}
      aria-label="Upload video"
      aria-hidden={!active}
    >
      {/* Progress Bar */}
      <div id="uploadProgressContainer" className="signup-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={3}>
        <div id="uploadProgressBar" className="signup-progress-bar" style={{ width: progressWidth }} />
        <div id="uploadProgessLabel1" className={`signup-progress-label signup-progress-label-1 ${step >= 1 ? 'active' : ''}`}>
          <i className="material-icons" aria-hidden="true">account_circle</i>Create an Account
        </div>
        <div id="uploadProgessLabel2" className={`signup-progress-label signup-progress-label-2 ${step >= 2 ? 'active' : ''}`}>
          <i className="material-icons" aria-hidden="true">format_paint</i>Personalize
        </div>
        <div id="uploadProgessLabel3" className={`signup-progress-label signup-progress-label-3 ${step >= 3 ? 'active' : ''}`}>
          <i className="material-icons" aria-hidden="true">check_circle</i>Finish
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        id="uploadClose"
        className="upload-close button-float active"
        onClick={() => onHideUpload?.()}
        aria-label="Close upload"
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </button>
      <button
        id="uploadNext"
        className="upload-next button-float active"
        onClick={() => onNextUpload?.()}
        aria-label="Next step"
      >
        <i className="material-icons" aria-hidden="true">navigate_next</i>
      </button>
      <button
        id="uploadPrev"
        className={`upload-prev button-float ${step > 1 ? 'active' : ''}`}
        onClick={() => onPrevUpload?.()}
        aria-label="Previous step"
      >
        <i className="material-icons" aria-hidden="true">navigate_before</i>
      </button>

      {/* Step 1: Select Source */}
      <div className={`upload-page ${step === 1 ? 'active' : ''}`} id="upload1">
        <h2 className="upload-title">Post a Video</h2>
        <p className="upload-desc">
          [SiteName] doesn't host videos directly. You can link to a video, or pick one from a cloud hosting service.
        </p>

        {/* Link Input */}
        <div id="uploadLinkBox" className={`upload-link ${showLinkInput ? 'active' : ''}`}>
          <button
            className="material-icons upload-link-back"
            onClick={() => setShowLinkInput(false)}
            aria-label="Go back"
          >
            arrow_back
          </button>
          <div className="upload-link-wrap">
            <i className="material-icons upload-label" aria-hidden="true">link</i>
            <input
              id="uploadLinkInput"
              className="upload-link-input input"
              placeholder="Link to a Video"
              type="url"
              aria-label="Video URL"
            />
            <button className="material-icons upload-go" aria-label="Submit link">
              arrow_forward
            </button>
          </div>
        </div>

        {/* YouTube Input */}
        <div id="uploadYoutubeBox" className={`upload-link ${showYoutubeInput ? 'active' : ''}`}>
          <button
            className="material-icons upload-link-back"
            onClick={() => setShowYoutubeInput(false)}
            aria-label="Go back"
          >
            arrow_back
          </button>
          <div className="upload-link-wrap">
            <i className="material-icons upload-label" aria-hidden="true">link</i>
            <input
              id="uploadYoutubeInput"
              className="upload-link-input input"
              placeholder="Link to a YouTube Video"
              type="url"
              aria-label="YouTube URL"
            />
            <button className="material-icons upload-go" aria-label="Submit YouTube link">
              arrow_forward
            </button>
          </div>
        </div>

        {/* Facebook Input */}
        <div id="uploadFacebookBox" className={`upload-link ${showFacebookInput ? 'active' : ''}`}>
          <button
            className="material-icons upload-link-back"
            onClick={() => setShowFacebookInput(false)}
            aria-label="Go back"
          >
            arrow_back
          </button>
          <div className="upload-link-wrap">
            <i className="material-icons upload-label" aria-hidden="true">link</i>
            <input
              id="uploadFacebookInput"
              className="upload-link-input input"
              placeholder="Link to a Facebook Post"
              type="url"
              aria-label="Facebook URL"
            />
            <button className="material-icons upload-go" aria-label="Submit Facebook link">
              arrow_forward
            </button>
          </div>
        </div>

        {/* Source Selection Buttons */}
        <button
          className={`upload-item-select ${showLinkInput ? 'hidden' : ''}`}
          id="uploadLink"
          onClick={() => setShowLinkInput(true)}
          aria-label="Paste a link"
        >
          <i className="material-icons" aria-hidden="true">link</i>
        </button>
        <span className={`upload-link-divide ${showLinkInput || showYoutubeInput || showFacebookInput ? 'hidden' : ''}`} />
        <button
          className={`upload-item-select ${showYoutubeInput ? 'hidden' : ''}`}
          id="uploadYoutube"
          onClick={() => setShowYoutubeInput(true)}
          aria-label="Upload from YouTube"
        >
          <i className="zmdi zmdi-youtube" aria-hidden="true" />
        </button>
        <button
          className={`upload-item-select ${showFacebookInput ? 'hidden' : ''}`}
          id="uploadFacebook"
          onClick={() => setShowFacebookInput(true)}
          aria-label="Upload from Facebook"
        >
          <i className="zmdi zmdi-facebook" aria-hidden="true" />
        </button>
        <button className="upload-item-select" id="uploadDrive" aria-label="Upload from Google Drive">
          <i className="zmdi zmdi-google-drive" aria-hidden="true" />
        </button>
        <button className="upload-item-select" id="uploadDropbox" aria-label="Upload from Dropbox">
          <i className="zmdi zmdi-dropbox" aria-hidden="true" />
        </button>
      </div>

      {/* Step 2: Video Information */}
      <div className={`upload-page ${step === 2 ? 'active' : ''}`} id="upload2">
        <div className="upload-inputs" id="upload2Inputs">
          <p className="upload-desc" />
          <div id="uploadFrame" className="upload-frame">
            <i className="material-icons" aria-hidden="true">file_upload</i>
          </div>
          <div id="uploadInputTitle" className="upload-input upload-input-title">
            <input type="text" className="input" placeholder="Title" aria-label="Video title" />
          </div>
          <div className="dropdown upload-visibility">
            <p className="selected pre">
              <span>
                <i className="material-icons dropdown-label" aria-hidden="true">visibility</i>
                Privacy
              </span>
              <i className="material-icons dropdown-chevron" aria-hidden="true">keyboard_arrow_down</i>
            </p>
            <ul className="dropdown-list" role="listbox" aria-label="Privacy options">
              <li role="option"><i className="material-icons dropdown-label" aria-hidden="true">notifications_active</i>Public</li>
              <li role="option"><i className="material-icons dropdown-label" aria-hidden="true">notifications_off</i>Unannounced</li>
              <li role="option"><i className="material-icons dropdown-label" aria-hidden="true">link</i>Unlisted</li>
              <li role="option"><i className="material-icons dropdown-label" aria-hidden="true">visibility_off</i>Private</li>
            </ul>
          </div>
          <br />
          <div id="uploadInputChat" className="upload-input upload-input-desc">
            <input type="text" className="input" placeholder="Link to a Discussion Page (i.e. reddit)" aria-label="Discussion link" />
          </div>
          <div id="uploadInputDesc" className="upload-input upload-input-desc">
            <textarea className="input" placeholder="Description" aria-label="Video description" />
          </div>
        </div>
      </div>

      {/* Step 3: Settings */}
      <div className={`upload-page ${step === 3 ? 'active' : ''}`} id="upload3">
        <h2 className="upload-title">Video Settings</h2>
        <p className="upload-desc" />
      </div>
    </section>
  )
})

export default Upload
