import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  TextField,
  LinearProgress,
  Typography,
  Stack,
  Alert,
  IconButton,
  Paper,
  Tab,
  Tabs,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import RefreshIcon from "@mui/icons-material/Refresh";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import FolderPickerDialog from "../components/FolderPickerDialog";
import { type ScanStatus, type VideoSummary, scanApi, videosApi } from "../api/videos";

// ── 未辨識番號 Tab ─────────────────────────────────────────────
interface UnmatchedItem {
  id: number;
  code: string;
  title: string | null;
  file_path: string;
  inputCode: string;
  inputTitle: string;
  searchResults: VideoSummary[] | null;
  searching: boolean;
  confirming: boolean;
}

function UnmatchedTab({ onLoad }: { onLoad: (count: number) => void }) {
  const [items, setItems] = useState<UnmatchedItem[]>([]);

  const load = async () => {
    const r = await fetch("http://localhost:8000/api/videos?status=unmatched&page_size=200");
    const data = await r.json();
    const mapped = (data.items as any[]).map((v) => ({
      id: v.id,
      code: v.code || "",
      title: v.title || null,
      file_path: v.file_path || "",
      inputCode: "",
      inputTitle: "",
      searchResults: null,
      searching: false,
      confirming: false,
    }));
    setItems(mapped);
    onLoad(mapped.length);
  };

  useEffect(() => { load(); }, []);

  const updateItem = (idx: number, patch: Partial<UnmatchedItem>) =>
    setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  // 番號查詢（修正：透過 code 參數傳入新番號）
  const handleFetchByCode = async (idx: number) => {
    const item = items[idx];
    const code = item.inputCode.trim().toUpperCase();
    if (!code) return;
    updateItem(idx, { searching: true });
    try {
      await videosApi.refetch(item.id, code);
      setItems((prev) => prev.filter((_, i) => i !== idx));
    } catch (e: any) {
      alert(e?.response?.data?.detail || "查詢失敗");
      updateItem(idx, { searching: false });
    }
  };

  // 標題搜尋：先在本庫搜尋預覽，讓使用者確認
  const handleSearchByTitle = async (idx: number) => {
    const item = items[idx];
    const title = item.inputTitle.trim();
    if (!title) return;
    updateItem(idx, { searching: true, searchResults: null });
    try {
      const r = await videosApi.search(title);
      updateItem(idx, { searching: false, searchResults: r.data.items });
    } catch {
      updateItem(idx, { searching: false, searchResults: [] });
    }
  };

  // 確認套用標題
  const handleConfirmTitle = async (idx: number) => {
    const item = items[idx];
    const title = item.inputTitle.trim();
    if (!title) return;
    updateItem(idx, { confirming: true });
    try {
      await videosApi.setTitle(item.id, title);
      setItems((prev) => prev.filter((_, i) => i !== idx));
    } catch (e: any) {
      alert(e?.response?.data?.detail || "設定標題失敗");
      updateItem(idx, { confirming: false });
    }
  };

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: "center" }}>
        目前沒有未辨識番號的影片 ✓
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {items.map((item, idx) => (
        <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}>
          {/* 現有番號與標題 */}
          <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 0.5 }}>
            <Typography variant="caption" fontWeight={700} color="primary.light">
              {item.code}
            </Typography>
            {item.title && (
              <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: 11 }}>
                {item.title}
              </Typography>
            )}
          </Stack>
          <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1, wordBreak: "break-all", fontSize: 10 }}>
            {item.file_path}
          </Typography>

          {/* 番號查詢 */}
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              fullWidth
              value={item.inputCode}
              disabled={item.searching || item.confirming}
              onChange={(e) => updateItem(idx, { inputCode: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") handleFetchByCode(idx); }}
              placeholder="手動輸入正確番號，例如 SSIS-123"
            />
            <Button
              variant="contained"
              size="small"
              color="success"
              disabled={!item.inputCode.trim() || item.searching || item.confirming}
              onClick={() => handleFetchByCode(idx)}
              sx={{ whiteSpace: "nowrap" }}
            >
              {item.searching && item.inputCode.trim() ? "查詢中..." : "番號查詢"}
            </Button>
          </Stack>

          {/* 標題搜尋 */}
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              fullWidth
              value={item.inputTitle}
              disabled={item.searching || item.confirming}
              onChange={(e) => updateItem(idx, { inputTitle: e.target.value, searchResults: null })}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearchByTitle(idx); }}
              placeholder="輸入標題進行搜尋確認..."
            />
            <Button
              variant="outlined"
              size="small"
              disabled={!item.inputTitle.trim() || item.searching || item.confirming}
              onClick={() => handleSearchByTitle(idx)}
              sx={{ whiteSpace: "nowrap" }}
            >
              {item.searching && item.inputTitle.trim() ? "搜尋中..." : "搜尋"}
            </Button>
          </Stack>

          {/* 搜尋結果 */}
          {item.searchResults !== null && (
            <Box sx={{ mt: 1, pl: 0.5 }}>
              {item.searchResults.length === 0 ? (
                <Typography variant="caption" color="text.disabled">
                  庫中無相符結果
                </Typography>
              ) : (
                <Stack spacing={0.5} sx={{ mb: 0.5 }}>
                  {item.searchResults.map((v) => (
                    <Stack key={v.id} direction="row" spacing={1} alignItems="center">
                      {v.cover_local_path ? (
                        <Box
                          component="img"
                          src={`http://localhost:8000/${v.cover_local_path}`}
                          sx={{ width: 40, height: 27, objectFit: "cover", borderRadius: 0.5, flexShrink: 0 }}
                        />
                      ) : (
                        <Box sx={{ width: 40, height: 27, bgcolor: "action.hover", borderRadius: 0.5, flexShrink: 0 }} />
                      )}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" fontWeight={700} color="primary.light" display="block">
                          {v.code}
                        </Typography>
                        {v.title && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: 10 }}>
                            {v.title}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              )}
              <Button
                variant="contained"
                size="small"
                color="warning"
                disabled={item.confirming}
                onClick={() => handleConfirmTitle(idx)}
                sx={{ mt: 0.5, fontSize: 11 }}
              >
                {item.confirming ? "套用中..." : `確認套用標題「${item.inputTitle.trim()}」`}
              </Button>
            </Box>
          )}
        </Paper>
      ))}
    </Stack>
  );
}

// ── 無封面影片 Tab ─────────────────────────────────────────────
function NoCoverTab() {
  const [items, setItems] = useState<VideoSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [fetchingId, setFetchingId] = useState<number | null>(null);
  const [batchProgress, setBatchProgress] = useState<{ done: number; total: number } | null>(null);
  const abortRef = useRef(false);

  const load = async (search = q) => {
    setLoading(true);
    try {
      const r = await videosApi.list({ no_cover: true, exclude_unmatched: true, q: search || undefined, page_size: 200 });
      setItems(r.data.items);
      setTotal(r.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fetchOne = async (id: number) => {
    setFetchingId(id);
    try {
      const r = await videosApi.refetch(id);
      if (r.data.cover_local_path) {
        setItems((prev) => prev.filter((v) => v.id !== id));
        setTotal((t) => t - 1);
      }
    } finally {
      setFetchingId(null);
    }
  };

  const fetchAll = async () => {
    abortRef.current = false;
    const list = [...items];
    setBatchProgress({ done: 0, total: list.length });
    for (let i = 0; i < list.length; i++) {
      if (abortRef.current) break;
      const id = list[i].id;
      const gotCover = await videosApi.refetch(id)
        .then((r) => Boolean(r.data.cover_local_path))
        .catch(() => false);
      if (gotCover) {
        setItems((prev) => prev.filter((v) => v.id !== id));
        setTotal((t) => t - 1);
      }
      setBatchProgress({ done: i + 1, total: list.length });
    }
    setBatchProgress(null);
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="搜尋番號或標題..."
          value={q}
          onChange={(e) => { setQ(e.target.value); load(e.target.value); }}
        />
        <IconButton size="small" onClick={() => load()} title="重新載入" sx={{ color: "text.secondary" }}>
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Stack>

      {batchProgress ? (
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={Math.round((batchProgress.done / batchProgress.total) * 100)}
            sx={{ mb: 0.5, borderRadius: 1 }}
          />
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {batchProgress.done} / {batchProgress.total} 補抓中...
            </Typography>
            <Button size="small" color="error" onClick={() => { abortRef.current = true; }} sx={{ fontSize: 11 }}>
              停止
            </Button>
          </Stack>
        </Box>
      ) : (
        items.length > 0 && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<ImageSearchIcon />}
            onClick={fetchAll}
            sx={{ mb: 1.5 }}
          >
            全部補抓（{items.length} 筆）
          </Button>
        )
      )}

      {loading && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

      {!loading && items.length === 0 && (
        <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: "center" }}>
          {q ? "無符合結果" : "目前所有影片都有封面 ✓"}
        </Typography>
      )}

      <Stack spacing={0.75}>
        {items.map((v) => (
          <Paper key={v.id} variant="outlined" sx={{ p: 1, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" fontWeight={700} color="primary.light" display="block">
                {v.code}
              </Typography>
              {v.title && (
                <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ fontSize: 11 }}>
                  {v.title}
                </Typography>
              )}
            </Box>
            <Button
              size="small"
              variant="outlined"
              disabled={fetchingId === v.id || batchProgress !== null}
              onClick={() => fetchOne(v.id)}
              sx={{ flexShrink: 0, fontSize: 11 }}
            >
              {fetchingId === v.id ? "抓取中..." : "補抓"}
            </Button>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}

// ── 主頁面 ─────────────────────────────────────────────────────
export default function ScanPage() {
  const [folders, setFolders] = useState<string[]>([""]);
  const [status, setStatus] = useState<ScanStatus | null>(null);
  const [scanning, setScanning] = useState(false);
  const [unmatchedCount, setUnmatchedCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState<number>(0);
  const [forceRescan, setForceRescan] = useState(false);
  const [importingCovers, setImportingCovers] = useState(false);
  const [importResult, setImportResult] = useState<{ matched: number; skipped: number } | null>(null);
  const [tab, setTab] = useState(0);

  const openPicker = (idx: number) => { setPickerTargetIdx(idx); setPickerOpen(true); };
  const addFolder = () => setFolders((f) => [...f, ""]);
  const removeFolder = (i: number) => setFolders((f) => f.filter((_, idx) => idx !== i));
  const updateFolder = (i: number, val: string) =>
    setFolders((f) => f.map((v, idx) => (idx === i ? val : v)));

  const startScan = async () => {
    const paths = folders.map((f) => f.trim()).filter(Boolean);
    setScanning(true);
    setStatus(null);
    try {
      await scanApi.start(paths, forceRescan);
      pollRef.current = setInterval(async () => {
        const r = await scanApi.status();
        setStatus(r.data);
        if (!r.data.running) {
          clearInterval(pollRef.current!);
          setScanning(false);
        }
      }, 1000);
    } catch (e: any) {
      alert(e?.response?.data?.detail || "掃描失敗");
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

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
          <Stack key={i} direction="row" spacing={1} alignItems="center">
            <TextField
              fullWidth
              size="small"
              value={f}
              onChange={(e) => updateFolder(i, e.target.value)}
              placeholder={`資料夾路徑 #${i + 1}，例如 D:\Videos`}
            />
            <IconButton size="small" onClick={() => openPicker(i)} sx={{ color: "text.secondary" }} title="瀏覽">
              <FolderOpenIcon fontSize="small" />
            </IconButton>
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

      <FolderPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => updateFolder(pickerTargetIdx, path)}
      />

      <FormControlLabel
        control={
          <Checkbox
            size="small"
            checked={forceRescan}
            onChange={(e) => setForceRescan(e.target.checked)}
          />
        }
        label={
          <Typography variant="body2" color={forceRescan ? "warning.main" : "text.secondary"}>
            重新掃描已存在的影片（強制更新 metadata）
          </Typography>
        }
        sx={{ mb: 2, ml: 0 }}
      />

      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          onClick={startScan}
          disabled={scanning}
          color={forceRescan ? "warning" : "primary"}
        >
          {scanning ? "掃描中..." : forceRescan ? "強制重新掃描" : "開始掃描"}
        </Button>
        <Button
          variant="outlined"
          startIcon={<ImageSearchIcon />}
          disabled={importingCovers}
          onClick={async () => {
            setImportingCovers(true);
            setImportResult(null);
            try {
              const r = await scanApi.localCovers();
              setImportResult(r.data);
            } finally {
              setImportingCovers(false);
            }
          }}
        >
          {importingCovers ? "掃描中..." : "匯入本地封面"}
        </Button>
      </Stack>

      {importResult && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setImportResult(null)}>
          封面匯入完成：{importResult.matched} 筆已匯入，{importResult.skipped} 筆略過
        </Alert>
      )}

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

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="inherit" indicatorColor="primary">
          <Tab
            label={
              <Stack direction="row" spacing={0.75} alignItems="center">
                <span>待辨識番號</span>
                {unmatchedCount > 0 && (
                  <Chip label={unmatchedCount} size="small" color="warning" sx={{ height: 18, fontSize: 11 }} />
                )}
              </Stack>
            }
          />
          <Tab label="無封面影片" />
        </Tabs>
      </Box>

      {tab === 0 && (
        <UnmatchedTab onLoad={(count) => setUnmatchedCount(count)} />
      )}
      {tab === 1 && <NoCoverTab />}
    </Box>
  );
}
