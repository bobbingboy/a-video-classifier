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
  Divider,
  Paper,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
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
    <Box sx={{ p: 3 }}>
      {/* 返回列 */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} size="small" sx={{ color: "text.secondary" }}>
          返回
        </Button>
        <Stack direction="row" spacing={1}>
          {!editing ? (
            <>
              <Button size="small" startIcon={<EditIcon />} onClick={() => setEditing(true)} sx={{ color: "text.secondary" }}>
                編輯
              </Button>
              <Button size="small" startIcon={<RefreshIcon />} onClick={handleRefetch} sx={{ color: "text.secondary" }}>
                重新抓取
              </Button>
            </>
          ) : (
            <>
              <Button size="small" startIcon={<SaveIcon />} variant="contained" onClick={handleSave} disabled={saving}>
                {saving ? "儲存中..." : "儲存"}
              </Button>
              <IconButton size="small" onClick={() => setEditing(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={3} alignItems="flex-start">
        {/* 封面 */}
        <Box sx={{ flexShrink: 0 }}>
          <Paper
            elevation={6}
            sx={{ borderRadius: 2, overflow: "hidden", width: 220, bgcolor: "#1e1e1e" }}
          >
            {video.cover_local_path ? (
              <Box
                component="img"
                src={coverSrc(video.cover_local_path)}
                alt={video.title || video.code}
                sx={{ width: "100%", display: "block" }}
              />
            ) : (
              <Box
                sx={{
                  width: 220,
                  height: 310,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography color="text.disabled" fontSize={13}>No Cover</Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* 內容 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <EditForm form={form} setForm={setForm} />
          ) : (
            <ViewMode video={video} onActorClick={(name) => navigate(`/?actor=${encodeURIComponent(name)}`)} />
          )}
        </Box>
      </Stack>
    </Box>
  );
}

function ViewMode({ video, onActorClick }: { video: IVideoDetail; onActorClick: (n: string) => void }) {
  const meta = [
    ["番號", video.code],
    ["出版商", video.studio?.name],
    ["發行日期", video.release_date],
    ["時長", video.duration],
    ["來源", video.metadata_source],
  ] as [string, string | undefined][];

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5, lineHeight: 1.4 }}>
        {video.title || "（無標題）"}
      </Typography>
      <Typography variant="caption" color="primary.light" fontWeight={700} sx={{ letterSpacing: 1 }}>
        {video.code}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1} sx={{ mb: 2.5 }}>
        {meta.filter(([, v]) => v).map(([label, value]) => (
          <Stack key={label} direction="row" spacing={1.5}>
            <Typography variant="body2" color="text.disabled" sx={{ width: 68, flexShrink: 0 }}>
              {label}
            </Typography>
            <Typography variant="body2">{value}</Typography>
          </Stack>
        ))}
      </Stack>

      {/* 演員 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 0.75, textTransform: "uppercase", letterSpacing: 0.8 }}>
          演員
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {video.actors.length === 0
            ? <Typography variant="body2" color="text.disabled">—</Typography>
            : video.actors.map((a) => (
                <Chip
                  key={a.id}
                  label={a.name}
                  size="small"
                  onClick={() => onActorClick(a.name)}
                  clickable
                  sx={{ bgcolor: "#2a2a4a", color: "#a5b4fc", "&:hover": { bgcolor: "#3a3a6a" } }}
                />
              ))}
        </Box>
      </Box>

      {/* 分類 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 0.75, textTransform: "uppercase", letterSpacing: 0.8 }}>
          分類
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          {video.tags.length === 0
            ? <Typography variant="body2" color="text.disabled">—</Typography>
            : video.tags.map((t) => (
                <Chip key={t.id} label={t.name} size="small" sx={{ bgcolor: "#1e2e1e", color: "#86efac" }} />
              ))}
        </Box>
      </Box>

      {video.file_path && (
        <>
          <Divider sx={{ mb: 1.5 }} />
          <Typography variant="caption" color="text.disabled" sx={{ wordBreak: "break-all" }}>
            {video.file_path}
          </Typography>
        </>
      )}
    </Box>
  );
}

function EditForm({ form, setForm }: { form: VideoUpdate; setForm: (f: VideoUpdate) => void }) {
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
    </Stack>
  );
}
