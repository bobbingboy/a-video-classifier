import { useEffect, useState } from "react";
import { type ActorWithCount, type TagWithCount, actorsApi, tagsApi } from "../api/videos";

interface Props {
  selectedActor: string;
  selectedTag: string;
  onActorChange: (name: string) => void;
  onTagChange: (name: string) => void;
}

export default function FilterSidebar({
  selectedActor,
  selectedTag,
  onActorChange,
  onTagChange,
}: Props) {
  const [actors, setActors] = useState<ActorWithCount[]>([]);
  const [tags, setTags] = useState<TagWithCount[]>([]);

  useEffect(() => {
    actorsApi.list().then((r) => setActors(r.data.slice(0, 50)));
    tagsApi.list().then((r) => setTags(r.data.slice(0, 50)));
  }, []);

  const itemStyle = (active: boolean): React.CSSProperties => ({
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    background: active ? "#4f46e5" : "transparent",
    color: active ? "#fff" : "#ccc",
    marginBottom: "2px",
    display: "flex",
    justifyContent: "space-between",
  });

  return (
    <aside style={{ width: "200px", flexShrink: 0 }}>
      <section style={{ marginBottom: "24px" }}>
        <h3 style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", marginBottom: "8px" }}>
          演員
        </h3>
        {selectedActor && (
          <div style={itemStyle(true)} onClick={() => onActorChange("")}>
            {selectedActor} ✕
          </div>
        )}
        {actors
          .filter((a) => a.name !== selectedActor)
          .map((a) => (
            <div key={a.id} style={itemStyle(false)} onClick={() => onActorChange(a.name)}>
              <span>{a.name}</span>
              <span style={{ color: "#666" }}>{a.video_count}</span>
            </div>
          ))}
      </section>

      <section>
        <h3 style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", marginBottom: "8px" }}>
          分類
        </h3>
        {selectedTag && (
          <div style={itemStyle(true)} onClick={() => onTagChange("")}>
            {selectedTag} ✕
          </div>
        )}
        {tags
          .filter((t) => t.name !== selectedTag)
          .map((t) => (
            <div key={t.id} style={itemStyle(false)} onClick={() => onTagChange(t.name)}>
              <span>{t.name}</span>
              <span style={{ color: "#666" }}>{t.video_count}</span>
            </div>
          ))}
      </section>
    </aside>
  );
}
