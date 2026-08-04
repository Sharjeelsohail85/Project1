import { memo, useRef, useState, useEffect, useCallback, useMemo } from "react";
import ContentItem from "./ContentItem";
import { getLocalChannelVideos } from "../services/videoService";
import { videoAPI } from "../services/api.service";
import useSmoothWheelScroll from "../hooks/useSmoothWheelScroll";

// Rich catalog of items with tags
const CATALOG_ITEMS = [
  { id: "cat-1", title: "Modern Web Architecture & AI Development", username: "TechVision", views: "14.2k", rating: "9.2/10", description: "In-depth guide to building scalable modern web apps with modern frameworks and AI services.", tags: ["Technology", "Gaming"], isPick: true, isNsfw: false },
  { id: "cat-2", title: "Lo-Fi Beats & Instrumental Chill Session", username: "ChillBeats", views: "58.1k", rating: "9.8/10", description: "Relaxing lo-fi hip hop beats for studying, working, and unwinding.", tags: ["Music"], isPick: true, isNsfw: false },
  { id: "cat-3", title: "Pro Gaming Highlights: Championship Finals", username: "PixelPro", views: "89.4k", rating: "9.5/10", description: "The most insane clutch moments and team plays from the esports championship.", tags: ["Gaming", "Sports"], isPick: false, isNsfw: false },
  { id: "cat-4", title: "Quantum Computing Explained Simply", username: "SciLab", views: "23.8k", rating: "8.9/10", description: "Demystifying quantum mechanics, qubits, and quantum supremacy for non-scientists.", tags: ["Education", "Technology"], isPick: true, isNsfw: false },
  { id: "cat-5", title: "Standup Special: Laugh Out Loud Night", username: "ComedyCentral", views: "42.0k", rating: "8.7/10", description: "A hilarious hour of live standup comedy covering modern life and technology.", tags: ["Comedy"], isPick: false, isNsfw: false },
  { id: "cat-6", title: "Global News Highlights & Daily Analysis", username: "DailyDigest", views: "12.5k", rating: "8.1/10", description: "A quick round-up of top international news headlines and economic perspectives.", tags: ["News"], isPick: false, isNsfw: false },
  { id: "cat-7", title: "Epic Cinematic Movie Trailers 2026", username: "CineWorld", views: "112.0k", rating: "9.6/10", description: "First look at upcoming sci-fi, action, and drama blockbusters hitting theaters.", tags: ["Movies"], isPick: true, isNsfw: false },
  { id: "cat-8", title: "Mastering Italian Pasta & Cooking Techniques", username: "ChefStudio", views: "34.6k", rating: "9.4/10", description: "Step-by-step masterclass on making handmade pasta dough and authentic sauces.", tags: ["Cooking"], isPick: true, isNsfw: false },
  { id: "cat-9", title: "Backpacking Through Hidden Gems in Europe", username: "Wanderlust", views: "67.3k", rating: "9.1/10", description: "Exploring secluded mountain villages and historic European towns off the beaten path.", tags: ["Travel"], isPick: false, isNsfw: false },
  { id: "cat-10", title: "Indie Game Development Log & Retrospective", username: "IndieDevLog", views: "19.8k", rating: "8.8/10", description: "Lessons learned building and launching an indie roguelike game on digital storefronts.", tags: ["Gaming", "Technology"], isPick: false, isNsfw: false },
  { id: "cat-11", title: "Acoustic Live Concert & Backstage Highlights", username: "MusicVibes", views: "45.2k", rating: "9.3/10", description: "Intimate acoustic performances with exclusive interviews and backstage footage.", tags: ["Music"], isPick: true, isNsfw: false },
  { id: "cat-12", title: "Extreme Mountain Biking & Action Sports", username: "AdrenalineRush", views: "51.0k", rating: "9.0/10", description: "High-speed downhill mountain bike trials through steep pine forests.", tags: ["Sports"], isPick: false, isNsfw: false },
  { id: "cat-13", title: "Full Stack Coding Tutorial & Tips", username: "CodeAcademy", views: "38.4k", rating: "9.7/10", description: "Comprehensive breakdown of full-stack TypeScript, React, and backend design.", tags: ["Education", "Technology"], isPick: true, isNsfw: false },
  { id: "cat-14", title: "Street Food Tour: Spiciest Dishes in Asia", username: "FoodieCentral", views: "82.5k", rating: "9.5/10", description: "Sampling famous night market street food delicacies across East Asia.", tags: ["Cooking", "Travel"], isPick: false, isNsfw: false },
  { id: "cat-15", title: "Hilarious Tech Fails & Bloopers Compilation", username: "TechBloopers", views: "94.1k", rating: "8.9/10", description: "When smart home devices and gadgets go completely off the rails.", tags: ["Comedy", "Technology"], isPick: false, isNsfw: false },
  { id: "cat-16", title: "Deep Sea Exploration & Ocean Discoveries", username: "OceanDoc", views: "29.7k", rating: "9.2/10", description: "Submersible footage revealing bioluminescent ocean life in the abyssal zone.", tags: ["Education", "Travel"], isPick: false, isNsfw: false },
  { id: "cat-17", title: "Top Synthwave Hits & Retro Visuals", username: "RetroWave", views: "73.2k", rating: "9.6/10", description: "Retro-futuristic 80s neon aesthetics paired with heavy analog synthwave tracks.", tags: ["Music"], isPick: true, isNsfw: false },
  { id: "cat-18", title: "Strategy Guide: Dominating RPG Games", username: "GamerGuild", views: "22.4k", rating: "8.6/10", description: "Optimizing skill trees, gear builds, and boss battle strategies.", tags: ["Gaming"], isPick: false, isNsfw: false },
  { id: "cat-19", title: "Breaking Technology News & AI Releases", username: "TechToday", views: "31.9k", rating: "8.8/10", description: "Key announcements in artificial intelligence, hardware, and mobile computing.", tags: ["News", "Technology"], isPick: false, isNsfw: false },
  { id: "cat-20", title: "Behind the Scenes: Film Directing Basics", username: "FilmSchool", views: "18.3k", rating: "9.0/10", description: "Camera placement, lighting setups, and blocking scenes for aspiring filmmakers.", tags: ["Movies", "Education"], isPick: false, isNsfw: false },
];

function inferSourceType(item) {
  const rawType = String(
    item?.type || item?.source_type || item?.sourceType || "Upload",
  )
    .trim()
    .toLowerCase();
  const explicit = String(item?.source_type || item?.sourceType || "").trim();

  if (explicit && explicit !== "creator_migrated") {
    return explicit;
  }

  if (rawType === "migration") return "creator_migrated";
  if (rawType === "google drive" || rawType === "gdrive") return "uploadgoogle";
  if (rawType === "youtube") return "uploadyoutube";
  if (rawType === "facebook") return "uploadfacebook";
  if (rawType === "dropbox") return "uploaddropbox";
  if (rawType === "direct link" || rawType === "direct") return "uploadLink";
  if (rawType === "local") return "local";

  return "creator_migrated";
}

const Browser = memo(function Browser({ activePage, onOpenVideo }) {
  const browserContentRef = useRef(null);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [videosError, setVideosError] = useState("");

  // User tags & preferences state
  const [userTags, setUserTags] = useState([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState("ALL");

  // Load user tags from localStorage & listen for updates
  const syncUserTags = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("user_custom_tags");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUserTags(parsed);
          return;
        }
      }
      setUserTags([]);
    } catch {
      setUserTags([]);
    }
  }, []);

  useEffect(() => {
    syncUserTags();

    const handleUpdate = (e) => {
      if (e?.detail?.tags && Array.isArray(e.detail.tags)) {
        setUserTags(e.detail.tags);
      } else {
        syncUserTags();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("user_tags_updated", handleUpdate);
      window.addEventListener("storage", syncUserTags);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("user_tags_updated", handleUpdate);
        window.removeEventListener("storage", syncUserTags);
      }
    };
  }, [syncUserTags]);

  const userTagKeys = useMemo(() => {
    const keys = new Set();
    userTags.forEach((t) => {
      const key = String(t?.key || t?.name || "").toLowerCase().trim();
      if (key) keys.add(key);
    });
    return keys;
  }, [userTags]);

  useSmoothWheelScroll(browserContentRef, {
    enabled: false,
    damping: 0.1,
    wheelMultiplier: 1.15,
    maxDelta: 220,
    usePageFallback: false,
  });

  useEffect(() => {
    let cancelled = false;

    setVideosLoading(true);
    setVideosError("");

    videoAPI
      .my()
      .then((response) => {
        if (cancelled) return;
        const payload = response?.data || response || {};
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];
        const apiVideos = rows
          .map((item) => {
            const uuid = String(item?.uuid || item?.id || "").trim();
            return {
              id: uuid,
              title: String(item?.title || item?.name || "Untitled").trim(),
              username: String(
                item?.channel_name || item?.channel?.name || "My Channel",
              ).trim(),
              views: "—",
              rating: "—",
              description: String(item?.description || "").trim(),
              tags: Array.isArray(item?.tags) ? item.tags : ["Upload"],
              isPick: false,
              isNsfw: false,
              href: "",
              videoId: uuid,
              sourceUrl: String(
                item?.sourceUrl ||
                  item?.source_url ||
                  item?.video_url ||
                  item?.url ||
                  "",
              ).trim(),
              sourceType: inferSourceType(item),
              createdAt: String(
                item?.created_at || item?.createdAt || "",
              ).trim(),
            };
          })
          .filter((v) => v.id);

        const localRows = getLocalChannelVideos();
        const localVideos = (Array.isArray(localRows) ? localRows : [])
          .map((item) => {
            const uuid = String(item?.uuid || item?.id || "").trim();
            return {
              id: uuid,
              title: String(item?.title || item?.name || "Untitled").trim(),
              username: String(
                item?.channel_name || item?.channel?.name || "My Channel",
              ).trim(),
              views: "—",
              rating: "—",
              description: String(item?.description || "").trim(),
              tags: Array.isArray(item?.tags) ? item.tags : ["Upload"],
              isPick: false,
              isNsfw: false,
              href: "",
              videoId: uuid,
              sourceUrl: String(
                item?.sourceUrl ||
                  item?.source_url ||
                  item?.video_url ||
                  item?.url ||
                  "",
              ).trim(),
              sourceType: inferSourceType(item),
              createdAt: String(
                item?.created_at || item?.createdAt || "",
              ).trim(),
            };
          })
          .filter((v) => v.id);

        const seen = new Set();
        const merged = [...localVideos, ...apiVideos].filter((video) => {
          const vid = String(video?.id || "").trim();
          if (!vid || seen.has(vid)) return false;
          seen.add(vid);
          return true;
        });
        setVideos(merged);
      })
      .catch((error) => {
        if (cancelled) return;
        const localRows = getLocalChannelVideos();
        const localVideos = (Array.isArray(localRows) ? localRows : [])
          .map((item) => {
            const uuid = String(item?.uuid || item?.id || "").trim();
            return {
              id: uuid,
              title: String(item?.title || item?.name || "Untitled").trim(),
              username: String(
                item?.channel_name || item?.channel?.name || "My Channel",
              ).trim(),
              views: "—",
              rating: "—",
              description: String(item?.description || "").trim(),
              tags: Array.isArray(item?.tags) ? item.tags : ["Upload"],
              isPick: false,
              isNsfw: false,
              href: "",
              videoId: uuid,
              sourceUrl: String(
                item?.sourceUrl ||
                  item?.source_url ||
                  item?.video_url ||
                  item?.url ||
                  "",
              ).trim(),
              sourceType: inferSourceType(item),
              createdAt: String(
                item?.created_at || item?.createdAt || "",
              ).trim(),
            };
          })
          .filter((v) => v.id);
        setVideos(localVideos);
        setVideosError(
          localVideos.length
            ? ""
            : String(error?.message || "Unable to load videos."),
        );
      })
      .finally(() => {
        if (cancelled) return;
        setVideosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleOpenVideo = useCallback(
    (video) => {
      onOpenVideo?.({
        videoId: video.videoId,
        sourceUrl: video.sourceUrl,
        title: video.title,
        description: video.description,
        sourceType: video.sourceType || "creator_migrated",
      });
    },
    [onOpenVideo],
  );

  // Filter & sort helper for items matching tag criteria
  const filterAndSortByTags = useCallback((itemList) => {
    let result = [...itemList];

    // Filter by specific tag if clicked
    if (selectedTagFilter !== "ALL") {
      const lowerFilter = selectedTagFilter.toLowerCase();
      result = result.filter((item) =>
        Array.isArray(item.tags) && item.tags.some((t) => String(t).toLowerCase() === lowerFilter)
      );
    }

    // Sort items so those matching user's active tags appear first
    if (userTagKeys.size > 0) {
      result.sort((a, b) => {
        const aMatches = Array.isArray(a.tags) && a.tags.some((t) => userTagKeys.has(String(t).toLowerCase()));
        const bMatches = Array.isArray(b.tags) && b.tags.some((t) => userTagKeys.has(String(t).toLowerCase()));
        if (aMatches && !bMatches) return -1;
        if (!aMatches && bMatches) return 1;
        return 0;
      });
    }

    return result;
  }, [selectedTagFilter, userTagKeys]);

  // Tab specific items
  const picksItems = useMemo(() => {
    const raw = CATALOG_ITEMS.filter((item) => item.isPick);
    return filterAndSortByTags(raw);
  }, [filterAndSortByTags]);

  const recommendedItems = useMemo(() => {
    if (userTagKeys.size === 0) {
      return filterAndSortByTags(CATALOG_ITEMS);
    }
    // Prioritize videos that match user tags
    const matched = CATALOG_ITEMS.filter((item) =>
      Array.isArray(item.tags) && item.tags.some((t) => userTagKeys.has(String(t).toLowerCase()))
    );
    const others = CATALOG_ITEMS.filter((item) =>
      !Array.isArray(item.tags) || !item.tags.some((t) => userTagKeys.has(String(t).toLowerCase()))
    );
    return filterAndSortByTags([...matched, ...others]);
  }, [filterAndSortByTags, userTagKeys]);

  const popularItems = useMemo(() => {
    const sorted = [...CATALOG_ITEMS].sort((a, b) => {
      const vA = parseFloat(a.views) || 0;
      const vB = parseFloat(b.views) || 0;
      return vB - vA;
    });
    return filterAndSortByTags(sorted);
  }, [filterAndSortByTags]);

  const subscriptionItems = useMemo(() => {
    const subs = CATALOG_ITEMS.slice(0, 10);
    return filterAndSortByTags(subs);
  }, [filterAndSortByTags]);

  const randomItems = useMemo(() => {
    const rand = CATALOG_ITEMS.slice().reverse();
    return filterAndSortByTags(rand);
  }, [filterAndSortByTags]);

  return (
    <div id="browser" className="browser">
      {/* Dynamic Tag Personalization Banner */}
      <div
        className="browser-tag-banner"
        style={{
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'rgba(33, 33, 33, 0.88)' }}>
          <i className="material-icons" style={{ fontSize: '18px', color: 'var(--theme-color, #673ab7)' }}>loyalty</i>
          <span>Tag Personalization:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
          <button
            type="button"
            onClick={() => setSelectedTagFilter('ALL')}
            style={{
              padding: '4px 12px',
              borderRadius: '16px',
              border: selectedTagFilter === 'ALL' ? 'none' : '1px solid rgba(0,0,0,0.15)',
              background: selectedTagFilter === 'ALL' ? 'var(--theme-color, #673ab7)' : 'rgba(0,0,0,0.04)',
              color: selectedTagFilter === 'ALL' ? '#ffffff' : 'rgba(0,0,0,0.75)',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            All Videos
          </button>

          {userTags.map((tag) => {
            const isFilterActive = selectedTagFilter.toLowerCase() === tag.key.toLowerCase();
            return (
              <button
                key={tag.key}
                type="button"
                onClick={() => setSelectedTagFilter(isFilterActive ? 'ALL' : tag.name)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  border: isFilterActive ? 'none' : '1px solid var(--theme-color, #673ab7)',
                  background: isFilterActive ? 'var(--theme-color, #673ab7)' : 'rgba(103, 58, 183, 0.08)',
                  color: isFilterActive ? '#ffffff' : 'var(--theme-color, #673ab7)',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                }}
              >
                <i className="material-icons" style={{ fontSize: '12px' }}>check</i>
                #{tag.name}
              </button>
            );
          })}

          {userTags.length === 0 && (
            <span style={{ fontSize: '12px', color: 'rgba(0,0,0,0.55)', fontStyle: 'italic' }}>
              No custom tags selected yet. Add tags in Settings to customize your video feed!
            </span>
          )}
        </div>
      </div>

      <div
        id="browserContent"
        className="browser-content"
        ref={browserContentRef}
      >
        {/* Editors' Picks */}
        <div
          id="browserContentPicks"
          className={`browser-content-page ${activePage === "browserContentPicks" ? "" : "hidden"}`}
          role="tabpanel"
          aria-labelledby="browserNavPicks"
        >
          {picksItems.map((item) => (
            <ContentItem
              key={item.id}
              {...item}
              userTagKeys={userTagKeys}
              onOpenVideo={() =>
                onOpenVideo?.({
                  videoId: item.id,
                  title: item.title,
                  description: item.description,
                  sourceType: "creator_migrated",
                })
              }
            />
          ))}
        </div>

        {/* Videos */}
        <div
          id="browserContentVideos"
          className={`browser-content-page ${activePage === "browserContentVideos" ? "" : "hidden"}`}
          role="tabpanel"
          aria-labelledby="browserNavVideos"
        >
          {videosLoading ? (
            <div className="browser-content-status">
              <p>Loading videos…</p>
            </div>
          ) : videosError ? (
            <div className="browser-content-status browser-content-status-error">
              <p>{videosError}</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="browser-content-status">
              <p>
                No uploaded videos yet. Upload or migrate a video to see it here.
              </p>
            </div>
          ) : (
            filterAndSortByTags(videos).map((item) => (
              <ContentItem
                key={item.id}
                title={item.title}
                username={item.username}
                views={item.views}
                rating={item.rating}
                description={item.description}
                createdAt={item.createdAt}
                tags={item.tags}
                userTagKeys={userTagKeys}
                onOpenVideo={() => handleOpenVideo(item)}
              />
            ))
          )}
        </div>

        {/* Popular */}
        <div
          id="browserContentPop"
          className={`browser-content-page ${activePage === "browserContentPop" ? "" : "hidden"}`}
          role="tabpanel"
          aria-labelledby="browserNavPop"
        >
          {popularItems.map((item) => (
            <ContentItem
              key={item.id}
              {...item}
              userTagKeys={userTagKeys}
              onOpenVideo={() =>
                onOpenVideo?.({
                  videoId: item.id,
                  title: item.title,
                  description: item.description,
                  sourceType: "creator_migrated",
                })
              }
            />
          ))}
        </div>

        {/* Subscriptions */}
        <div
          id="browserContentSubs"
          className={`browser-content-page ${activePage === "browserContentSubs" ? "" : "hidden"}`}
          role="tabpanel"
          aria-labelledby="browserNavSubs"
        >
          {subscriptionItems.map((item) => (
            <ContentItem
              key={item.id}
              {...item}
              userTagKeys={userTagKeys}
              onOpenVideo={() =>
                onOpenVideo?.({
                  videoId: item.id,
                  title: item.title,
                  description: item.description,
                  sourceType: "creator_migrated",
                })
              }
            />
          ))}
        </div>

        {/* Recommended */}
        <div
          id="browserContentRec"
          className={`browser-content-page ${activePage === "browserContentRec" ? "" : "hidden"}`}
          role="tabpanel"
          aria-labelledby="browserNavRec"
        >
          {recommendedItems.map((item) => (
            <ContentItem
              key={item.id}
              {...item}
              userTagKeys={userTagKeys}
              onOpenVideo={() =>
                onOpenVideo?.({
                  videoId: item.id,
                  title: item.title,
                  description: item.description,
                  sourceType: "creator_migrated",
                })
              }
            />
          ))}
        </div>

        {/* Random */}
        <div
          id="browserContentRand"
          className={`browser-content-page ${activePage === "browserContentRand" ? "" : "hidden"}`}
          role="tabpanel"
          aria-labelledby="browserNavRand"
        >
          {randomItems.map((item) => (
            <ContentItem
              key={item.id}
              {...item}
              userTagKeys={userTagKeys}
              onOpenVideo={() =>
                onOpenVideo?.({
                  videoId: item.id,
                  title: item.title,
                  description: item.description,
                  sourceType: "creator_migrated",
                })
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
});

export default Browser;
