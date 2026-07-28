import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { tagAPI, userAPI } from '../services/api.service'

const TAG_MIN_LENGTH = 2
const TAG_MAX_LENGTH = 40

// Backend mapping (as requested):
// personalizeSearch -> users.address
// relevantAds       -> users.phone
const PREFERENCE_SEARCH_ON = 'pref_search_on'
const PREFERENCE_SEARCH_OFF = 'pref_search_off'
const PREFERENCE_ADS_ON = 'pref_ads_on'
const PREFERENCE_ADS_OFF = 'pref_ads_off'

const FALLBACK_POPULAR_TAGS = [
  'Music',
  'Gaming',
  'Technology',
  'Sports',
  'Education',
  'Comedy',
  'News',
  'Movies',
  'Cooking',
  'Travel',
]

function normalizeTagName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ')
}

function normalizeTagKey(name) {
  return normalizeTagName(name).toLowerCase()
}

function createTagItemFromApi(apiTag, fallbackId) {
  const tag = apiTag?.tag || apiTag
  const tagName = normalizeTagName(tag?.name || '')
  const normalizedActive = Number(tag?.active)

  return {
    id: tag?.uuid || apiTag?.tag_id || fallbackId,
    name: tagName,
    key: normalizeTagKey(tagName),
    active: Number.isNaN(normalizedActive) ? Boolean(tag?.active) : normalizedActive !== 0,
  }
}

function buildPayloadFromUser(user, preferences) {
  const firstName = String(user?.first_name || '').trim()
  const lastName = String(user?.last_name || '').trim()

  return {
    first_name: firstName || 'User',
    last_name: lastName || 'Preferences',
    phone: preferences.relevantAds ? PREFERENCE_ADS_ON : PREFERENCE_ADS_OFF,
    address: preferences.personalizeSearch ? PREFERENCE_SEARCH_ON : PREFERENCE_SEARCH_OFF,
    google_app_name: String(user?.google_app_name || '').trim() || 'pref-app',
    google_client_id: String(user?.google_client_id || '').trim() || 'pref-google-client',
    google_client_secret: String(user?.google_client_secret || '').trim() || 'pref-google-secret',
    google_api_key: String(user?.google_api_key || '').trim() || 'pref-google-api',
  }
}

function derivePreferencesFromUser(user) {
  const address = String(user?.address || '').trim().toLowerCase()
  const phone = String(user?.phone || '').trim().toLowerCase()

  return {
    personalizeSearch: address === PREFERENCE_SEARCH_ON,
    relevantAds: phone === PREFERENCE_ADS_ON,
  }
}

function buildFallbackPopularTags() {
  return FALLBACK_POPULAR_TAGS.map((name, index) => ({
    id: `fallback-popular-${index}`,
    name,
    key: normalizeTagKey(name),
    active: true,
  }))
}

export function validateTagInput(rawValue, userTags, popularTags) {
  const value = normalizeTagName(rawValue)
  if (!value) {
    return { valid: false, reason: 'Tag cannot be empty.' }
  }

  if (value.length < TAG_MIN_LENGTH) {
    return { valid: false, reason: `Tag must be at least ${TAG_MIN_LENGTH} characters.` }
  }

  if (value.length > TAG_MAX_LENGTH) {
    return { valid: false, reason: `Tag must be under ${TAG_MAX_LENGTH + 1} characters.` }
  }

  const nextKey = normalizeTagKey(value)
  const existsInUser = userTags.some((tag) => tag.key === nextKey)
  if (existsInUser) {
    return { valid: false, reason: 'This tag is already selected.' }
  }

  const matchedPopular = popularTags.find((tag) => tag.key === nextKey)
  return { valid: true, value, matchedPopular }
}

export function useTags() {
  const [userTags, setUserTags] = useState([])
  const [popularTags, setPopularTags] = useState([])
  const [preferences, setPreferences] = useState({
    personalizeSearch: false,
    relevantAds: false,
  })

  const [loading, setLoading] = useState({
    initial: true,
    addTag: false,
    removeTag: null,
    toggle: null,
  })

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  })

  const [errorState, setErrorState] = useState({
    tagInput: '',
    page: '',
  })

  const currentUserRef = useRef(null)

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const closeSnackbar = useCallback(() => {
    setSnackbar((previous) => ({ ...previous, open: false }))
  }, [])

  const clearTagInputError = useCallback(() => {
    setErrorState((previous) => ({ ...previous, tagInput: '' }))
  }, [])

  const getInitialData = useCallback(async ({ silent = false, keepPreferences = false } = {}) => {
    if (!silent) {
      setLoading((previous) => ({ ...previous, initial: true }))
    }
    setErrorState((previous) => ({ ...previous, page: '' }))

    try {
      const [userResult, userTagsResult, popularTagsResult] = await Promise.allSettled([
        userAPI.me(),
        tagAPI.userTags(),
        tagAPI.popular(),
      ])

      const userResponse = userResult.status === 'fulfilled' ? userResult.value : null
      const userTagsResponse = userTagsResult.status === 'fulfilled' ? userTagsResult.value : null
      const popularTagsResponse = popularTagsResult.status === 'fulfilled' ? popularTagsResult.value : null

      const userPayload = userResponse?.data?.data || null
      currentUserRef.current = userPayload

      const initialPreferences = derivePreferencesFromUser(userPayload)

      const parsedPopularTags = (popularTagsResponse?.data?.data || [])
        .map((tag, index) => createTagItemFromApi(tag, `popular-${index}`))
        .filter((tag) => tag.name)

      const parsedUserTags = (userTagsResponse?.data?.data || [])
        .map((userTag, index) => createTagItemFromApi(userTag, `user-${index}`))
        .filter((tag) => tag.name)

      const uniquePopular = []
      const popularKeys = new Set()
      parsedPopularTags.forEach((tag) => {
        if (popularKeys.has(tag.key)) return
        popularKeys.add(tag.key)
        uniquePopular.push(tag)
      })

      const uniqueUser = []
      const userKeys = new Set()
      parsedUserTags.forEach((tag) => {
        if (userKeys.has(tag.key)) return
        userKeys.add(tag.key)
        uniqueUser.push(tag)
      })

      const hasPopularTags = uniquePopular.length > 0
      setPopularTags(hasPopularTags ? uniquePopular : buildFallbackPopularTags())
      setUserTags(uniqueUser)
      if (!keepPreferences) {
        setPreferences(initialPreferences)
      }
      const criticalFailure = userResult.status === 'rejected' && userTagsResult.status === 'rejected' && popularTagsResult.status === 'rejected'
      if (criticalFailure) {
        const message = userResult.reason?.message || userTagsResult.reason?.message || popularTagsResult.reason?.message || 'Failed to load tags and preferences.'
        setErrorState((previous) => ({ ...previous, page: message }))
        showSnackbar(message, 'error')
      }
    } catch (error) {
      const message = error?.message || 'Failed to load tags and preferences.'
      setErrorState((previous) => ({ ...previous, page: message }))
      showSnackbar(message, 'error')
    } finally {
      if (!silent) {
        setLoading((previous) => ({ ...previous, initial: false }))
      }
    }
  }, [showSnackbar])

  useEffect(() => {
    getInitialData()
  }, [getInitialData])

  const addTag = useCallback(
    async (rawValue) => {
      const validation = validateTagInput(rawValue, userTags, popularTags)
      if (!validation.valid) {
        setErrorState((previous) => ({ ...previous, tagInput: validation.reason }))
        return false
      }

      const nextName = validation.value
      const nextKey = normalizeTagKey(nextName)
      const matchedPopular = validation.matchedPopular
      const optimisticTag = {
        id: matchedPopular?.id || `temp-${Date.now()}`,
        name: nextName,
        key: nextKey,
        active: true,
      }

      setLoading((previous) => ({ ...previous, addTag: true }))
      clearTagInputError()
      setUserTags((previous) => [...previous, optimisticTag])

      try {
        console.log('[useTags] Adding tag:', { nextName, matchedPopular })
        
        if (matchedPopular?.id) {
          console.log('[useTags] Adding popular tag with ID:', matchedPopular.id)
          await tagAPI.addUserTag(matchedPopular.id)
        } else {
          console.log('[useTags] Adding custom tag:', nextName)
          await tagAPI.addCustomTag(nextName)
        }

        console.log('[useTags] Tag added successfully, refetching data')
        await getInitialData({ silent: true, keepPreferences: true })
        showSnackbar('Tag added successfully.', 'success')
        return true
      } catch (error) {
        console.error('[useTags] Error adding tag:', error)
        setUserTags((previous) => previous.filter((tag) => tag.key !== nextKey))
        const message = error?.message || 'Unable to add tag.'
        setErrorState((previous) => ({ ...previous, tagInput: message }))
        showSnackbar(message, 'error')
        return false
      } finally {
        setLoading((previous) => ({ ...previous, addTag: false }))
      }
    },
    [clearTagInputError, getInitialData, popularTags, showSnackbar, userTags],
  )

  const removeTag = useCallback(
    async (tag) => {
      if (!tag?.id) return

      const previousTags = userTags
      setLoading((previous) => ({ ...previous, removeTag: tag.key }))
      setUserTags((existing) => existing.filter((item) => item.key !== tag.key))

      try {
        await tagAPI.removeUserTag(tag.id)
        showSnackbar('Tag removed successfully.', 'success')
      } catch (error) {
        setUserTags(previousTags)
        showSnackbar(error?.message || 'Unable to remove tag.', 'error')
      } finally {
        setLoading((previous) => ({ ...previous, removeTag: null }))
      }
    },
    [showSnackbar, userTags],
  )

  const togglePreference = useCallback(
    async (key, value) => {
      if (!Object.prototype.hasOwnProperty.call(preferences, key)) {
        return
      }

      const previousPreferences = preferences
      const nextPreferences = {
        ...previousPreferences,
        [key]: value,
      }

      setLoading((previous) => ({ ...previous, toggle: key }))
      setPreferences(nextPreferences)

      try {
        const payload = buildPayloadFromUser(currentUserRef.current, nextPreferences)
        await userAPI.update(payload)
        currentUserRef.current = {
          ...(currentUserRef.current || {}),
          ...payload,
        }
        showSnackbar('Preference updated.', 'success')
      } catch (error) {
        setPreferences(previousPreferences)
        showSnackbar(error?.message || 'Unable to update preference.', 'error')
      } finally {
        setLoading((previous) => ({ ...previous, toggle: null }))
      }
    },
    [preferences, showSnackbar],
  )

  const popularTagsWithSelection = useMemo(() => {
    const selectedKeys = new Set(userTags.map((tag) => tag.key))
    return popularTags.map((tag) => ({
      ...tag,
      selected: selectedKeys.has(tag.key),
    }))
  }, [popularTags, userTags])

  return {
    userTags,
    popularTags: popularTagsWithSelection,
    preferences,
    loading,
    snackbar,
    errorState,
    actions: {
      addTag,
      removeTag,
      togglePreference,
      closeSnackbar,
      clearTagInputError,
      refetch: getInitialData,
    },
  }
}
