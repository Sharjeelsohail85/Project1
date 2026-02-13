import { memo, useState, useCallback } from 'react'
import ColorPicker from './ColorPicker'
import { loginWithOAuth } from '../services/auth.service'

const Signup = memo(function Signup({
  active,
  step,
  onHideSignup,
  onNextSignup,
  onPrevSignup,
  onColorChange,
  onLoginSuccess
}) {
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  
  // Handle OAuth signup
  const handleOAuthSignup = useCallback(async (provider) => {
    try {
      const userInfo = await loginWithOAuth(provider)
      console.log(`Successfully signed up with ${provider}:`, userInfo)
      // If signup is successful, treat it as login success
      if (onLoginSuccess) {
        onLoginSuccess()
      } else {
        // Continue to next step if no login success handler
        onNextSignup?.()
      }
    } catch (err) {
      console.error(`Failed to sign up with ${provider}:`, err)
      alert(`Failed to sign up with ${provider}. Please try again.`)
    }
  }, [onLoginSuccess, onNextSignup])
  
  const progressWidth = `${((step - 1) / 3) * 100}%`

  return (
    <section
      id="signup"
      className={`signup ${active ? 'active' : ''}`}
      aria-label="Sign up"
      aria-hidden={!active}
    >
      {/* Progress Bar */}
      <div id="signupProgressContainer" className="signup-progress" role="progressbar" aria-valuenow={step} aria-valuemin={1} aria-valuemax={4}>
        <div id="signupProgressBar" className="signup-progress-bar" style={{ width: progressWidth }} />
      </div>

      {/* Navigation Buttons */}
      <button
        id="signupClose"
        className="signup-close button-float active"
        onClick={() => onHideSignup?.()}
        aria-label="Close signup"
      >
        <i className="material-icons" aria-hidden="true">close</i>
      </button>
      <button
        id="signupNext"
        className="signup-next button-float active"
        onClick={() => onNextSignup?.()}
        aria-label="Next step"
      >
        <i className="material-icons" aria-hidden="true">navigate_next</i>
      </button>
      <button
        id="signupPrev"
        className={`signup-prev button-float ${step > 1 ? 'active' : ''}`}
        onClick={() => onPrevSignup?.()}
        aria-label="Previous step"
      >
        <i className="material-icons" aria-hidden="true">navigate_before</i>
      </button>

      {/* Step 1: Create Account */}
      <div id="signup1" className={`signup-page-1 signup-page ${step === 1 ? 'active' : ''}`}>
        <h2 className="signup-title">Create an Account</h2>
        <p className="signup-desc">Choose a username and login method.</p>

        {/* Name Input */}
        <div id="signupInputName" className="upload-link-wrap signup-input-username">
          <i className="material-icons upload-label" aria-hidden="true">account_circle</i>
          <input
            id="signupNameInput"
            className="upload-link-input input"
            type="text"
            placeholder="Full Name"
            aria-label="Full Name"
          />
        </div>

        {/* Email Input */}
        <div id="signupInputEmail" className="upload-link-wrap signup-input-email">
          <i className="material-icons upload-label" aria-hidden="true">email</i>
          <input
            id="signupEmailInput"
            className="upload-link-input input"
            type="email"
            placeholder="Email"
            aria-label="Email"
          />
        </div>

        {/* Password Input */}
        <div id="signupPasswordBox" className={`upload-link ${showPasswordInput ? 'active' : ''}`}>
          <button
            className="material-icons upload-link-back"
            onClick={() => setShowPasswordInput(false)}
            aria-label="Go back"
          >
            arrow_back
          </button>
          <div className="upload-link-wrap">
            <i className="material-icons upload-label" aria-hidden="true">vpn_key</i>
            <input
              id="signupPasswordInput"
              className="upload-link-input input"
              type="password"
              placeholder="Password"
              aria-label="Password"
            />
            <button 
              className="material-icons upload-go" 
              aria-label="Submit password"
              onClick={async () => {
                const nameInput = document.getElementById('signupNameInput')
                const emailInput = document.getElementById('signupEmailInput')
                const passwordInput = document.getElementById('signupPasswordInput')
                
                const name = nameInput?.value || ''
                const email = emailInput?.value || ''
                const password = passwordInput?.value || ''
                
                if (!name || !email || !password) {
                  alert('Please fill in all fields')
                  return
                }
                
                try {
                  const { authAPI } = await import('../services/api.service')
                  const response = await authAPI.register({
                    name,
                    email,
                    password,
                    password_confirmation: password,
                  })
                  
                  if (response.data) {
                    // Registration successful, continue to next step
                    onNextSignup?.()
                  }
                } catch (err) {
                  alert(err.message || 'Registration failed. Please try again.')
                }
              }}
            >
              arrow_forward
            </button>
          </div>
        </div>

        {/* Auth Method Buttons */}
        <button
          className={`upload-item-select ${showPasswordInput ? 'hidden' : ''}`}
          id="signupPassword"
          onClick={() => setShowPasswordInput(true)}
          aria-label="Sign up with password"
        >
          <i className="material-icons" aria-hidden="true">vpn_key</i>
        </button>
        <span className={`upload-link-divide ${showPasswordInput ? 'hidden' : ''}`} />
        <button 
          className="upload-item-select" 
          id="signupGoogle" 
          aria-label="Sign up with Google"
          onClick={() => handleOAuthSignup('google')}
        >
          <i className="zmdi zmdi-google" aria-hidden="true" />
        </button>
        <button 
          className="upload-item-select" 
          id="signupFacebook" 
          aria-label="Sign up with Facebook"
          onClick={() => handleOAuthSignup('facebook')}
        >
          <i className="zmdi zmdi-facebook" aria-hidden="true" />
        </button>
        <button 
          className="upload-item-select" 
          id="signupDropbox" 
          aria-label="Sign up with Dropbox"
          onClick={() => handleOAuthSignup('dropbox')}
        >
          <i className="zmdi zmdi-dropbox" aria-hidden="true" />
        </button>
      </div>

      {/* Step 2: Tags */}
      <div id="signup2" className={`signup-page-2 signup-page ${step === 2 ? 'active' : ''}`}>
        <div className="signup-page-container">
          <div className="signup-content">
            {/* Tags Description */}
            <div className="signup-tags signup-item transparent">
              <div className="signup-item-desc">
                <h3 className="signup-item-title">Tags</h3>
                <span className="desc-text">
                  [ServiceName] uses tags to personalize your experience in a transparent way.
                </span>
                <span className="emphasis">
                  Tags are 1-2 word descriptions of your interests.<br />
                  If enough users with the tags you choose watch a video, it will be recommended to you.
                </span>
                
                {/* Toggle Options */}
                <div className="signup-toggle-parent button-toggle-parent">
                  <label className="button-toggle-label" htmlFor="tagsToggleSearch">
                    Use tags to personalize search results
                  </label>
                  <input
                    id="tagsToggleSearch"
                    type="checkbox"
                    className="button-toggle"
                    aria-label="Use tags to personalize search results"
                  />
                  <label htmlFor="tagsToggleSearch" />
                </div>
                <div className="signup-toggle-parent button-toggle-parent">
                  <label className="button-toggle-label" htmlFor="tagsToggleAds">
                    Use tags to make ads more relevant
                  </label>
                  <input
                    id="tagsToggleAds"
                    type="checkbox"
                    className="button-toggle"
                    aria-label="Use tags to make ads more relevant"
                  />
                  <label htmlFor="tagsToggleAds" />
                </div>
              </div>
            </div>

            {/* Tags Input */}
            <div className="signup-tags signup-item">
              <div className="signup-tags-header">
                <div className="signup-tags-header-input input">
                  <i className="material-icons" aria-hidden="true">loyalty</i>
                  <input id="sigupTagAdd" placeholder="Add a tag" aria-label="Add a tag" />
                  <i className="material-icons" aria-hidden="true">add</i>
                </div>
                <div id="signupTagLabel" className="signup-tags-header-label">Popular Tags</div>
              </div>
                <div className="signup-tags-current" />
                <div className="signup-tags-suggest" />
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Theme Color */}
      <div id="signup3" className={`signup-page-3 signup-page ${step === 3 ? 'active' : ''}`}>
        <h2 className="signup-title">Theme Color</h2>
        <div className="signup-page-container">
          <div className="signup-color signup-item transparent">
            <div className="signup-item-title" />
            <div className="signup-item-desc">
              <div className="color-height">
                <ColorPicker onColorChange={onColorChange} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Complete */}
      <div id="signup4" className={`signup-page-4 signup-page ${step === 4 ? 'active' : ''}`}>
        <h2 className="signup-title">You're Finished</h2>
        <div className="signup-page-container">
          <p className="signup-subtitle">Here are some other steps to consider.</p>
        </div>
      </div>
    </section>
  )
})

export default Signup
