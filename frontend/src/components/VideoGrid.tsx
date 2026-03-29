import { type VideoSummary } from "../api/videos";

interface Props {
  videos: VideoSummary[];
  onSelect: (id: number) => void;
}

function coverSrc(path: string | null): string {
  if (!path) return "";
  return `http://localhost:8000/${path}`;
}

export default function VideoGrid({ videos, onSelect }: Props) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "12px",
      }}
    >
      {videos.map((v) => (
        <div
          key={v.id}
          onClick={() => onSelect(v.id)}
          style={{
            cursor: "pointer",
            borderRadius: "6px",
            overflow: "hidden",
            background: "#1a1a1a",
            border: "1px solid #333",
          }}
        >
          {v.cover_local_path ? (
            <img
              src={coverSrc(v.cover_local_path)}
              alt={v.title || v.code}
              style={{ width: "100%", aspectRatio: "2/3", objectFit: "cover", display: "block" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                aspectRatio: "2/3",
                background: "#2a2a2a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontSize: "12px",
              }}
            >
              No Cover
            </div>
          )}
          <div style={{ padding: "6px 8px" }}>
            <div style={{ fontWeight: 600, fontSize: "11px", color: "#aaa" }}>{v.code}</div>
            {v.title && (
              <div
                style={{
                  fontSize: "11px",
                  color: "#ddd",
                  marginTop: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {v.title}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
