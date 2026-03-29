import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  TextField,
  LinearProgress,
  Typography,
  Stack,
  Alert,
  IconButton,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import { type ScanStatus, scanApi } from "../api/videos";

export default function ScanPage() {
  const [folders, setFolders] = useState<string[]>([""]);
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [scanning, setScanning] = useState(false);
  const [unmatched, setUnmatched] = useState<{ id: number; file_path: string; inputCode: string }[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addFolder = () => setFolders((f) => [...f, ""]);
  const removeFolder = (i: number) => setFolders((f) => f.filter((_, idx) => idx !== i));
  const updateFolder = (i: number, val: string) =>
    setFolders((f) => f.map((v, idx) => (idx === i ? val : v)));

  const startScan = async () => {
    const paths = folders.map((f) => f.trim()).filter(Boolean);
    setScanning(true);
    setStatus(null);
    try {
      await scanApi.start(paths);
      pollRef.current = setInterval(async () => {
        const r = await scanApi.status();
        setStatus(r.data);
        if (!r.data.running) {
          clearInterval(pollRef.current!);
          setScanning(false);
          loadUnmatched();
        }
      }, 1000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "掃描失敗");
      setScanning(false);
    }
  };

  const loadUnmatched = async () => {
    const r = await fetch("http://localhost:8000/api/videos?page_size=500");
    const data = await r.json();
    const items = (data.items as any[])
      .filter((v) => v.status === "unmatched")
      .map((v) => ({ id: v.id, file_path: v.file_path || "", inputCode: "" }));
    setUnmatched(items);
  };

  useEffect(() => {
    loadUnmatched();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const handleCodeSubmit = async (idx: number) => {
    const item = unmatched[idx];
    const code = item.inputCode.trim().toUpperCase();
    if (!code) return;
    await fetch(`http://localhost:8000/api/videos/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await fetch(`http://localhost:8000/api/videos/${item.id}/fetch`, { method: "POST" });
    setUnmatched((prev) => prev.filter((_, i) => i !== idx));
  };

  const progress = status
    ? Math.round((status.processed / Math.max(status.total, 1)) * 100)
    : 0;

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", p: 4 }}>
      <Typography variant="h6" gutterBottom>掃描影片資料夾</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        支援多個資料夾，系統會遞迴掃描所有子資料夾。
        也可在 <code>.env</code> 設定 <code>VIDEOS_FOLDERS</code>，留空直接點掃描即可使用預設路徑。
      </Typography>

      <Stack spacing={1} sx={{ mb: 2 }}>
        {folders.map((f, i) => (
          <Stack key={i} direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              value={f}
              onChange={(e) => updateFolder(i, e.target.value)}
              placeholder={`資料夾路徑 #${i + 1}，例如 D:/Videos`}
            />
            {folders.length > 1 && (
              <IconButton size="small" onClick={() => removeFolder(i)} sx={{ color: "text.secondary" }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        ))}
        <Box>
          <Button size="small" startIcon={<AddIcon />} onClick={addFolder} sx={{ color: "text.secondary" }}>
            新增資料夾
          </Button>
        </Box>
      </Stack>

      <Button
        variant="contained"
        onClick={startScan}
        disabled={scanning}
        sx={{ mb: 3 }}
      >
        {scanning ? "掃描中..." : "開始掃描"}
      </Button>

      {status && (
        <Box sx={{ mb: 4 }}>
          <LinearProgress variant="determinate" value={progress} sx={{ mb: 1, borderRadius: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {status.processed} / {status.total} 處理完成・{status.failed} 失敗
            {!status.running && "  ✓ 完成"}
          </Typography>
          {status.errors.length > 0 && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {status.errors.map((e, i) => <div key={i}>{e}</div>)}
            </Alert>
          )}
        </Box>
      )}

      {unmatched.length > 0 && (
        <Box>
          <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1.5 }}>
            未能辨識番號的檔案（{unmatched.length} 筆）
          </Typography>
          <Stack spacing={1}>
            {unmatched.map((item, idx) => (
              <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1, wordBreak: "break-all" }}>
                  {item.file_path}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    fullWidth
                    value={item.inputCode}
                    onChange={(e) =>
                      setUnmatched((prev) => prev.map((p, i) => i === idx ? { ...p, inputCode: e.target.value } : p))
                    }
                    placeholder="手動輸入番號，例如 SSIS-123"
                  />
                  <Button variant="contained" size="small" color="success" onClick={() => handleCodeSubmit(idx)}>
                    查詢
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
