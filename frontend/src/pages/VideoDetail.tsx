import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
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
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { type CodePreview, type VideoDetail as IVideoDetail, type VideoUpdate, scanApi, videosApi } from "../api/videos";

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
  const [videoStarted, setVideoStarted] = useState(false);

  // 番號修改狀態
  const [codeInput, setCodeInput] = useState("");
  const [codePreview, setCodePreview] = useState<CodePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [applyingCode, setApplyingCode] = useState(false);

  const initForm = (v: IVideoDetail) => {
    setForm({
      title: v.title || "",
      release_date: v.release_date || "",
      duration: v.duration || "",
      studio_name: v.studio?.name || "",
      actor_names: v.actors.map((a) => a.name),
      tag_names: v.tags.map((t) => t.name),
    });
    setCodeInput(v.code);
    setCodePreview(null);
  };

  useEffect(() => {
    setVideoStarted(false);
    videosApi.get(videoId).then((r) => {
      setVideo(r.data);
      initForm(r.data);
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

  const handlePreviewCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setPreviewLoading(true);
    setCodePreview(null);
    try {
      const r = await scanApi.preview(code);
      setCodePreview(r.data);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyCode = async (force = false) => {
    if (!video) return;
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setApplyingCode(true);
    try {
      await videosApi.refetch(video.id, code);
      const r = await videosApi.get(video.id);
      setVideo(r.data);
      initForm(r.data);
      setEditing(false);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "套用失敗");
    } finally {
      setApplyingCode(false);
    }
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

      {/* 媒體區塊：封面 / 播放器（合一） */}
      {(video.cover_local_path || (!editing && video.file_path?.toLowerCase().endsWith(".mp4"))) && (
        <Box sx={{ mb: 3 }}>
          <Paper elevation={6} sx={{ borderRadius: 2, overflow: "hidden", display: "inline-block", maxWidth: "100%" }}>
            {!editing && video.file_path?.toLowerCase().endsWith(".mp4") ? (
              videoStarted ? (
                <Box
                  component="video"
                  src={`http://localhost:8000/api/videos/${video.id}/stream`}
                  controls
                  autoPlay
                  sx={{ width: "100%", maxWidth: 720, display: "block" }}
                />
              ) : (
                <Box
                  sx={{ position: "relative", cursor: "pointer", display: "block", lineHeight: 0 }}
                  onClick={() => setVideoStarted(true)}
                >
                  {video.cover_local_path ? (
                    <Box
                      component="img"
                      src={coverSrc(video.cover_local_path)}
                      alt={video.title || video.code}
                      sx={{ width: "100%", maxWidth: 720, display: "block" }}
                    />
                  ) : (
                    <Box sx={{ width: 720, height: 405, bgcolor: "grey.900" }} />
                  )}
                  <Box
                    sx={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "rgba(0,0,0,0.25)",
                      transition: "bgcolor 0.2s",
                      "&:hover": { bgcolor: "rgba(0,0,0,0.4)" },
                    }}
                  >
                    <Box
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: "50%",
                        bgcolor: "rgba(0,0,0,0.55)",
                        border: "2px solid rgba(255,255,255,0.75)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.15s",
                        ".MuiBox-root:hover > * > &": { transform: "scale(1.08)" },
                      }}
                    >
                      <PlayArrowIcon sx={{ fontSize: 44, color: "white", ml: "3px" }} />
                    </Box>
                  </Box>
                </Box>
              )
            ) : (
              <Box
                component="img"
                src={coverSrc(video.cover_local_path!)}
                alt={video.title || video.code}
                sx={{ width: "100%", maxWidth: 720, display: "block" }}
              />
            )}
          </Paper>
        </Box>
      )}

      {/* 內容 */}
      <Box>
        {editing ? (
          <>
            {/* 番號修改區塊 */}
            <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
              <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1, textTransform: "uppercase", letterSpacing: 0.8 }}>
                修改番號
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: codePreview ? 1.5 : 0 }}>
                <TextField
                  size="small"
                  fullWidth
                  value={codeInput}
                  disabled={applyingCode}
                  onChange={(e) => { setCodeInput(e.target.value); setCodePreview(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePreviewCode(); }}
                  placeholder="輸入番號..."
                  inputProps={{ style: { textTransform: "uppercase" } }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  disabled={!codeInput.trim() || codeInput.trim().toUpperCase() === video.code || previewLoading || applyingCode}
                  onClick={handlePreviewCode}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  {previewLoading ? "查詢中..." : "查詢"}
                </Button>
              </Stack>

              {codePreview && (
                <Box>
                  {!codePreview.found ? (
                    <>
                      <Alert severity="warning" sx={{ mb: 1, py: 0.5 }}>
                        找不到番號「{codeInput.trim().toUpperCase()}」的 metadata
                      </Alert>
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        disabled={applyingCode}
                        onClick={() => handleApplyCode()}
                      >
                        {applyingCode ? "套用中..." : "強制套用番號（不更新 metadata）"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Paper variant="outlined" sx={{ p: 1.5, mb: 1, bgcolor: "action.hover" }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start">
                          {codePreview.cover_url && (
                            <Box
                              component="img"
                              src={codePreview.cover_url}
                              sx={{ width: 90, height: 60, objectFit: "cover", borderRadius: 0.5, flexShrink: 0 }}
                            />
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.25 }}>
                              {codePreview.title || "（無標題）"}
                            </Typography>
                            {codePreview.studio && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {codePreview.studio}
                              </Typography>
                            )}
                            {(codePreview.actors?.length ?? 0) > 0 && (
                              <Typography variant="caption" color="text.disabled" display="block">
                                {codePreview.actors!.join("、")}
                              </Typography>
                            )}
                            {codePreview.release_date && (
                              <Typography variant="caption" color="text.disabled" display="block">
                                {codePreview.release_date}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </Paper>
                      <Button
                        variant="contained"
                        size="small"
                        color="warning"
                        disabled={applyingCode}
                        onClick={() => handleApplyCode()}
                      >
                        {applyingCode ? "套用中..." : `確認套用番號「${codeInput.trim().toUpperCase()}」`}
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </Paper>

            <EditForm form={form} setForm={setForm} />
          </>
        ) : (
          <ViewMode video={video} onActorClick={(name) => navigate(`/?actor=${encodeURIComponent(name)}`)} />
        )}
      </Box>
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
