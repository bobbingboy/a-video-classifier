import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  TextField,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { type VideoDetail as IVideoDetail, type VideoUpdate, videosApi } from "../api/videos";

function coverSrc(path: string | null): string {
  if (!path) return "";
  return `http://localhost:8000/${path}`;
}

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoId = Number(id);

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

  if (!video) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        size="small"
        sx={{ mb: 2, color: "text.secondary" }}
      >
        返回
      </Button>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
        <Box sx={{ flexShrink: 0 }}>
          {video.cover_local_path ? (
            <Box
              component="img"
              src={coverSrc(video.cover_local_path)}
              alt={video.title || video.code}
              sx={{ width: 240, borderRadius: 2, display: "block" }}
            />
          ) : (
            <Box
              sx={{
                width: 240,
                height: 340,
                bgcolor: "#2a2a2a",
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography color="text.disabled">No Cover</Typography>
            </Box>
          )}
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Button variant="outlined" size="small" onClick={() => setEditing(!editing)}>
              {editing ? "取消" : "編輯"}
            </Button>
            <Button variant="outlined" size="small" onClick={handleRefetch}>
              重新抓取
            </Button>
          </Stack>
        </Box>

        <Box sx={{ flex: 1 }}>
          {editing ? (
            <EditForm form={form} setForm={setForm} onSave={handleSave} saving={saving} />
          ) : (
            <ViewMode video={video} onActorClick={(name) => { navigate(`/?actor=${encodeURIComponent(name)}`); }} />
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function ViewMode({ video, onActorClick }: { video: IVideoDetail; onActorClick: (n: string) => void }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>{video.title || "（無標題）"}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{video.code}</Typography>

      {[
        ["出版商", video.studio?.name],
        ["發行日期", video.release_date],
        ["時長", video.duration],
        ["來源", video.metadata_source],
        ["狀態", video.status],
      ].map(([label, value]) => (
        <Stack key={label} direction="row" spacing={1.5} sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ width: 72, flexShrink: 0 }}>
            {label}
          </Typography>
          <Typography variant="body2">{value || "—"}</Typography>
        </Stack>
      ))}

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>演員</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {video.actors.length === 0
            ? <Typography variant="body2" color="text.disabled">—</Typography>
            : video.actors.map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  size="small"
                  onClick={() => onActorClick(a.name)}
                  sx={{ cursor: "pointer", bgcolor: "#2a2a4a", color: "#a5b4fc" }}
                />
              ))}
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>分類</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {video.tags.length === 0
            ? <Typography variant="body2" color="text.disabled">—</Typography>
            : video.tags.map((t) => (
                <Chip key={t.id} label={t.name} size="small" sx={{ bgcolor: "#1a2a1a", color: "#86efac" }} />
              ))}
        </Box>
      </Box>

      {video.file_path && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 2, display: "block", wordBreak: "break-all" }}>
          {video.file_path}
        </Typography>
      )}
    </Box>
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
  return (
    <Stack spacing={2}>
      {(["title", "studio_name", "release_date", "duration"] as const).map((key) => (
        <TextField
          key={key}
          label={{ title: "標題", studio_name: "出版商", release_date: "發行日期", duration: "時長" }[key]}
          size="small"
          fullWidth
          value={(form[key] as string) || ""}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ))}
      <TextField
        label="演員（逗號分隔）"
        size="small"
        fullWidth
        value={(form.actor_names || []).join(", ")}
        onChange={(e) =>
          setForm({ ...form, actor_names: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
        }
      />
      <TextField
        label="分類（逗號分隔）"
        size="small"
        fullWidth
        value={(form.tag_names || []).join(", ")}
        onChange={(e) =>
          setForm({ ...form, tag_names: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
        }
      />
      <Button variant="contained" onClick={onSave} disabled={saving}>
        {saving ? "儲存中..." : "儲存"}
      </Button>
    </Stack>
  );
}
