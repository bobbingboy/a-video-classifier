import { useEffect, useState } from "react";
import { type VideoDetail as IVideoDetail, type VideoUpdate, videosApi } from "../api/videos";

interface Props {
  videoId: number;
  onBack: () => void;
  onActorClick: (name: string) => void;
}

function coverSrc(path: string | null): string {
  if (!path) return "";
  return `http://localhost:8000/${path}`;
}

export default function VideoDetailPage({ videoId, onBack, onActorClick }: Props) {
  const [video, setVideo] = useState<IVideoDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<VideoUpdate>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    videosApi.get(videoId).then((r) => {
      setVideo(r.data);
      setForm({
        title: r.data.title || "",
        release_date: r.data.release_date || "",
        duration: r.data.duration || "",
        studio_name: r.data.studio?.name || "",
        actor_names: r.data.actors.map((a) => a.name),
        tag_names: r.data.tags.map((t) => t.name),
      });
    });
  }, [videoId]);

  const handleSave = async () => {
    if (!video) return;
    setSaving(true);
    try {
      const r = await videosApi.update(video.id, form);
      setVideo(r.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRefetch = async () => {
    if (!video) return;
    await videosApi.refetch(video.id);
    const r = await videosApi.get(video.id);
    setVideo(r.data);
  };

  if (!video) return <div style={{ color: "#aaa", padding: "40px" }}>載入中...</div>;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px" }}>
      <button onClick={onBack} style={btnStyle}>← 返回</button>

      <div style={{ display: "flex", gap: "32px", marginTop: "24px" }}>
        <div style={{ flexShrink: 0 }}>
          {video.cover_local_path ? (
            <img
              src={coverSrc(video.cover_local_path)}
              alt={video.title || video.code}
              style={{ width: "240px", borderRadius: "8px" }}
            />
          ) : (
            <div style={{ width: "240px", height: "340px", background: "#2a2a2a", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
              No Cover
            </div>
          )}
          <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
            <button onClick={() => setEditing(!editing)} style={btnStyle}>
              {editing ? "取消" : "編輯"}
            </button>
            <button onClick={handleRefetch} style={btnStyle}>重新抓取</button>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          {editing ? (
            <EditForm form={form} setForm={setForm} onSave={handleSave} saving={saving} />
          ) : (
            <ViewMode video={video} onActorClick={onActorClick} />
          )}
        </div>
      </div>
    </div>
  );
}

function ViewMode({ video, onActorClick }: { video: IVideoDetail; onActorClick: (n: string) => void }) {
  return (
    <div style={{ color: "#ddd" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>{video.title || "（無標題）"}</h1>
      <div style={{ color: "#888", fontSize: "13px", marginBottom: "16px" }}>{video.code}</div>

      <Row label="出版商">{video.studio?.name || "—"}</Row>
      <Row label="發行日期">{video.release_date || "—"}</Row>
      <Row label="時長">{video.duration || "—"}</Row>
      <Row label="來源">{video.metadata_source || "—"}</Row>
      <Row label="狀態">{video.status}</Row>

      <div style={{ marginTop: "16px" }}>
        <div style={{ color: "#888", fontSize: "12px", marginBottom: "6px" }}>演員</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {video.actors.length === 0 && <span style={{ color: "#555" }}>—</span>}
          {video.actors.map((a) => (
            <span
              key={a.id}
              onClick={() => onActorClick(a.name)}
              style={{ background: "#2a2a4a", color: "#a5b4fc", padding: "3px 10px", borderRadius: "20px", fontSize: "13px", cursor: "pointer" }}
            >
              {a.name}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "16px" }}>
        <div style={{ color: "#888", fontSize: "12px", marginBottom: "6px" }}>分類</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {video.tags.length === 0 && <span style={{ color: "#555" }}>—</span>}
          {video.tags.map((t) => (
            <span key={t.id} style={{ background: "#1a2a1a", color: "#86efac", padding: "3px 10px", borderRadius: "20px", fontSize: "13px" }}>
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {video.file_path && (
        <div style={{ marginTop: "16px", fontSize: "12px", color: "#555", wordBreak: "break-all" }}>
          {video.file_path}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: "12px", marginBottom: "8px", fontSize: "14px" }}>
      <span style={{ color: "#666", width: "72px", flexShrink: 0 }}>{label}</span>
      <span style={{ color: "#ddd" }}>{children}</span>
    </div>
  );
}

function EditForm({
  form,
  setForm,
  onSave,
  saving,
}: {
  form: VideoUpdate;
  setForm: (f: VideoUpdate) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const field = (label: string, key: keyof VideoUpdate, type = "text") => (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ color: "#888", fontSize: "12px", display: "block", marginBottom: "4px" }}>{label}</label>
      <input
        type={type}
        value={(form[key] as string) || ""}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        style={{ width: "100%", padding: "6px 10px", background: "#1a1a1a", border: "1px solid #444", borderRadius: "4px", color: "#fff", fontSize: "14px" }}
      />
    </div>
  );

  return (
    <div>
      {field("標題", "title")}
      {field("出版商", "studio_name")}
      {field("發行日期", "release_date")}
      {field("時長", "duration")}
      <div style={{ marginBottom: "12px" }}>
        <label style={{ color: "#888", fontSize: "12px", display: "block", marginBottom: "4px" }}>演員（逗號分隔）</label>
        <input
          value={(form.actor_names || []).join(", ")}
          onChange={(e) => setForm({ ...form, actor_names: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          style={{ width: "100%", padding: "6px 10px", background: "#1a1a1a", border: "1px solid #444", borderRadius: "4px", color: "#fff", fontSize: "14px" }}
        />
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={{ color: "#888", fontSize: "12px", display: "block", marginBottom: "4px" }}>分類（逗號分隔）</label>
        <input
          value={(form.tag_names || []).join(", ")}
          onChange={(e) => setForm({ ...form, tag_names: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
          style={{ width: "100%", padding: "6px 10px", background: "#1a1a1a", border: "1px solid #444", borderRadius: "4px", color: "#fff", fontSize: "14px" }}
        />
      </div>
      <button onClick={onSave} disabled={saving} style={{ ...btnStyle, background: "#4f46e5" }}>
        {saving ? "儲存中..." : "儲存"}
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "6px 14px",
  background: "#2a2a2a",
  border: "1px solid #444",
  borderRadius: "6px",
  color: "#ddd",
  cursor: "pointer",
  fontSize: "13px",
};
