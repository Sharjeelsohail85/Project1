import { useMemo, useState } from 'react'
import { Alert, Box, Snackbar } from '@mui/material'
import { useTags } from '../../hooks/useTags'

function asClassName(value) {
  return value ? 'active' : ''
}

export default function TagsPage() {
  const [inputValue, setInputValue] = useState('')

  const {
    userTags,
    popularTags,
    preferences,
    loading,
    snackbar,
    errorState,
    actions,
  } = useTags()

  const selectedKeys = useMemo(() => new Set(userTags.map((tag) => tag.key)), [userTags])

  const handleAddFromInput = async () => {
    const cleaned = inputValue.trim().replace(/,$/, '')
    if (!cleaned) return

    const wasAdded = await actions.addTag(cleaned)
    if (wasAdded) {
      setInputValue('')
    }
  }

  const handleInputKeyDown = async (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      await handleAddFromInput()
    }
  }

  const handlePopularClick = async (tag) => {
    if (!tag || loading.addTag || loading.initial) return
    if (tag.selected || selectedKeys.has(tag.key)) return
    await actions.addTag(tag.name)
  }

  const handleToggleSearch = (event) => {
    actions.togglePreference('personalizeSearch', event.target.checked)
  }

  const handleToggleAds = (event) => {
    actions.togglePreference('relevantAds', event.target.checked)
  }

  return (
    <>
      <div className="signup-page-container">
        <div className="signup-content">
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

              <div className="signup-toggle-parent button-toggle-parent">
                <label className="button-toggle-label" htmlFor="tagsToggleSearch">
                  Use tags to personalize search results
                </label>
                <input
                  id="tagsToggleSearch"
                  type="checkbox"
                  className="button-toggle"
                  aria-label="Use tags to personalize search results"
                  checked={Boolean(preferences.personalizeSearch)}
                  onChange={handleToggleSearch}
                  disabled={loading.toggle === 'personalizeSearch'}
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
                  checked={Boolean(preferences.relevantAds)}
                  onChange={handleToggleAds}
                  disabled={loading.toggle === 'relevantAds'}
                />
                <label htmlFor="tagsToggleAds" />
              </div>
            </div>
          </div>

          <div className="signup-tags signup-item">
            <div className="signup-tags-header">
              <div className="signup-tags-header-input input">
                <i className="material-icons" aria-hidden="true">loyalty</i>

                <input
                  id="sigupTagAdd"
                  placeholder="Add a tag"
                  aria-label="Add a tag"
                  value={inputValue}
                  onChange={(event) => {
                    setInputValue(event.target.value)
                    if (errorState.tagInput) {
                      actions.clearTagInputError()
                    }
                  }}
                  onKeyDown={handleInputKeyDown}
                  disabled={loading.addTag || loading.initial}
                />

                <i
                  className="material-icons"
                  aria-hidden="true"
                  role="button"
                  tabIndex={0}
                  onClick={handleAddFromInput}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      void handleAddFromInput()
                    }
                  }}
                >
                  add
                </i>
              </div>

              <div id="signupTagLabel" className="signup-tags-header-label">Popular Tags</div>
            </div>

            <div className="signup-tags-current" role="list" aria-label="Selected tags">
              {userTags.map((tag) => (
                <button
                  key={`selected-${tag.key}`}
                  type="button"
                  role="listitem"
                  className={`signup-tag-pill signup-tag-pill-current ${asClassName(loading.removeTag === tag.key)}`}
                  onClick={() => actions.removeTag(tag)}
                  aria-label={`Remove ${tag.name}`}
                  disabled={loading.removeTag === tag.key || loading.initial}
                >
                  <span className="signup-tag-pill-label">{tag.name}</span>
                  <i className="material-icons" aria-hidden="true">close</i>
                </button>
              ))}
            </div>

            <div className="signup-tags-suggest" role="list" aria-label="Popular tags">
              {popularTags.map((tag) => {
                const isSelected = tag.selected || selectedKeys.has(tag.key)
                return (
                  <button
                    key={`popular-${tag.key}`}
                    type="button"
                    role="listitem"
                    className={`signup-tag-pill signup-tag-pill-suggest ${asClassName(isSelected)}`}
                    onClick={() => handlePopularClick(tag)}
                    disabled={isSelected || loading.addTag || loading.initial}
                    aria-label={isSelected ? `${tag.name} selected` : `Add ${tag.name}`}
                  >
                    <span className="signup-tag-pill-label">{tag.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {errorState.tagInput ? (
        <Box sx={{ position: 'absolute', left: 24, right: 24, bottom: 16, zIndex: 8 }}>
          <Alert severity="error" variant="filled">{errorState.tagInput}</Alert>
        </Box>
      ) : null}

      {errorState.page ? (
        <Box sx={{ position: 'absolute', left: 24, right: 24, bottom: 16, zIndex: 9 }}>
          <Alert
            severity="error"
            variant="filled"
            action={
              <button type="button" className="signup-tags-retry" onClick={() => actions.refetch()}>
                Retry
              </button>
            }
          >
            {errorState.page}
          </Alert>
        </Box>
      ) : null}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={actions.closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={actions.closeSnackbar} severity={snackbar.severity} variant="filled" elevation={6}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
