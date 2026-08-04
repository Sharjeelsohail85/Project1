import { memo, useState, useCallback, useRef, useEffect } from "react";

function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

const ContentItem = memo(function ContentItem({
  title,
  username,
  views,
  rating,
  description,
  createdAt,
  isPick = false,
  isNsfw = false,
  href,
  tags = [],
  userTagKeys = new Set(),
  onOpenVideo,
}) {
  const [isActive, setIsActive] = useState(false);
  const activeTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (activeTimeoutRef.current) {
        clearTimeout(activeTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(() => {
    if (activeTimeoutRef.current) {
      clearTimeout(activeTimeoutRef.current);
    }

    setIsActive(true);
    onOpenVideo?.();

    activeTimeoutRef.current = setTimeout(() => {
      setIsActive(false);
      activeTimeoutRef.current = null;
    }, 500);
  }, [onOpenVideo]);

  const itemClasses = [
    "browser-content-item",
    isPick ? "pick" : "",
    isNsfw ? "nsfw" : "",
    isActive ? "active" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={itemClasses} data-href={href} onClick={handleClick}>
      {/* Thumbnail Frame */}
      <div className="browser-content-item-frame">
        <div
          className="browser-content-item-frame-bg"
          role="img"
          aria-label={title ? `Thumbnail for ${title}` : "Video thumbnail"}
        />

        {/* View Count */}
        <div className="browser-content-item-views">
          <i className="material-icons" aria-hidden="true">
            visibility
          </i>
          <span>{views}</span>
        </div>

        {/* Rating */}
        <div className="browser-content-item-rating">
          <span>{rating}</span>
          <i className="material-icons" aria-hidden="true">
            thumbs_up_down
          </i>
        </div>

        {/* Play Button */}
        <div className="browser-content-item-play" aria-hidden="true">
          <i className="material-icons">play_arrow</i>
        </div>

        {/* NSFW Label */}
        {isNsfw && (
          <div className="browser-content-item-nsfw">
            <i className="material-icons" aria-hidden="true">
              visibility_off
            </i>
            NSFW
          </div>
        )}

        {/* Editors' Pick Label */}
        {isPick && (
          <div className="browser-content-item-picked">
            Picked
            <i className="material-icons" aria-hidden="true">
              account_balance
            </i>
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="browser-content-item-title">{title}</h3>

      {/* Tags */}
      {Array.isArray(tags) && tags.length > 0 && (
        <div
          className="browser-content-item-tags"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            margin: '4px 0 6px 0',
          }}
        >
          {tags.map((tag, idx) => {
            const isMatched = userTagKeys && userTagKeys.has(String(tag).toLowerCase())
            return (
              <span
                key={idx}
                style={{
                  fontSize: '11px',
                  fontWeight: isMatched ? '700' : '500',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isMatched ? 'var(--theme-color, #673ab7)' : 'rgba(0,0,0,0.06)',
                  color: isMatched ? '#ffffff' : 'rgba(0,0,0,0.7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  transition: 'all 0.2s ease',
                  border: isMatched ? 'none' : '1px solid rgba(0,0,0,0.08)',
                }}
              >
                {isMatched && <i className="material-icons" style={{ fontSize: '12px' }}>check</i>}
                #{tag}
              </span>
            )
          })}
        </div>
      )}

      {/* Info Section */}
      <div className="browser-content-item-info">
        {/* Username */}
        <div className="browser-content-item-user">
          <i className="material-icons" aria-hidden="true">
            account_circle
          </i>
          <span>{username}</span>
        </div>

        {/* Description (hidden by CSS) */}
        <p className="browser-content-item-desc">{description}</p>
        {createdAt && (
          <small className="browser-content-item-date">
            {formatDate(createdAt)}
          </small>
        )}

        {/* Pick Badge (hidden by CSS) */}
        {isPick && (
          <div className="browser-content-item-pick">Editors' Pick</div>
        )}

        {/* Report Button */}
        <button
          className="browser-content-item-info-report"
          aria-label="Report this video"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="browser-content-item-info-report-text">Report</span>
          <i className="material-icons" aria-hidden="true">
            report_problem
          </i>
        </button>
      </div>
    </article>
  );
});

export default ContentItem;
