import { useEffect, useRef, useState } from "react";
import { type ScanStatus, scanApi } from "../api/videos";

export default function ScanPage() {
  // 多個資料夾路徑，每行一個
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
    // Update code directly via PUT then trigger fetch
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
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "32px 24px", color: "#ddd" }}>
      <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>掃描影片資料夾</h1>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        支援多個資料夾，系統會遞迴掃描所有子資料夾。
        也可在 <code>.env</code> 設定 <code>VIDEOS_FOLDERS</code>，留空直接點掃描即可使用預設路徑。
      </p>

      {/* Folder inputs */}
      <div style={{ marginBottom: "16px" }}>
        {folders.map((f, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <input
              value={f}
              onChange={(e) => updateFolder(i, e.target.value)}
              placeholder={`資料夾路徑 #${i + 1}，例如 D:/Videos`}
              style={{ flex: 1, padding: "8px 12px", background: "#1a1a1a", border: "1px solid #444", borderRadius: "6px", color: "#fff", fontSize: "13px" }}
            />
            {folders.length > 1 && (
              <button onClick={() => removeFolder(i)} style={ghostBtn}>✕</button>
            )}
          </div>
        ))}
        <button onClick={addFolder} style={{ ...ghostBtn, marginTop: "4px", fontSize: "13px" }}>
          + 新增資料夾
        </button>
      </div>

      <button
        onClick={startScan}
        disabled={scanning}
        style={{ padding: "9px 24px", background: scanning ? "#333" : "#4f46e5", border: "none", borderRadius: "6px", color: "#fff", cursor: scanning ? "default" : "pointer", fontSize: "14px", marginBottom: "24px" }}
      >
        {scanning ? "掃描中..." : "開始掃描"}
      </button>

      {status && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ height: "8px", background: "#2a2a2a", borderRadius: "4px", overflow: "hidden", marginBottom: "8px" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#4f46e5", transition: "width 0.3s" }} />
          </div>
          <div style={{ fontSize: "13px", color: "#888" }}>
            {status.processed} / {status.total} 處理完成・{status.failed} 失敗
            {!status.running && " ✓ 完成"}
          </div>
          {status.errors.length > 0 && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: "#f87171" }}>
              {status.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      )}

      {unmatched.length > 0 && (
        <div>
          <h2 style={{ fontSize: "15px", marginBottom: "12px", color: "#f59e0b" }}>
            未能辨識番號的檔案（{unmatched.length} 筆）
          </h2>
          {unmatched.map((item, idx) => (
            <div key={item.id} style={{ marginBottom: "10px", padding: "10px 12px", background: "#1a1a1a", borderRadius: "6px", border: "1px solid #333" }}>
              <div style={{ fontSize: "12px", color: "#555", marginBottom: "6px", wordBreak: "break-all" }}>
                {item.file_path}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={item.inputCode}
                  onChange={(e) => setUnmatched((prev) => prev.map((p, i) => i === idx ? { ...p, inputCode: e.target.value } : p))}
                  placeholder="手動輸入番號，例如 SSIS-123"
                  style={{ flex: 1, padding: "5px 10px", background: "#111", border: "1px solid #444", borderRadius: "4px", color: "#fff", fontSize: "13px" }}
                />
                <button onClick={() => handleCodeSubmit(idx)} style={{ padding: "5px 12px", background: "#065f46", border: "none", borderRadius: "4px", color: "#fff", cursor: "pointer", fontSize: "13px" }}>
                  查詢
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const ghostBtn: React.CSSProperties = {
  padding: "6px 12px",
  background: "transparent",
  border: "1px solid #444",
  borderRadius: "6px",
  color: "#888",
  cursor: "pointer",
};
