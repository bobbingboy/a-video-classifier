import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  CircularProgress,
  Breadcrumbs,
  Link,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import client from "../api/client";

interface BrowseEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

interface BrowseResponse {
  path: string;
  parent: string | null;
  children: BrowseEntry[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export default function FolderPickerDialog({ open, onClose, onSelect }: Props) {
  const [current, setCurrent] = useState<BrowseResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const browse = async (path: string) => {
    setLoading(true);
    const r = await client.get<BrowseResponse>("/api/browse", { params: path ? { path } : {} });
    setCurrent(r.data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) browse("");
  }, [open]);

  const breadcrumbs = current?.path
    ? current.path.replace(/\\/g, "/").split("/").filter(Boolean)
    : [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { bgcolor: "background.paper" } }}>
      <DialogTitle sx={{ pb: 1, fontSize: 15 }}>選擇資料夾</DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* Breadcrumb */}
        <Box sx={{ px: 2, py: 1, borderBottom: "1px solid #2a2a2a" }}>
          {current?.path ? (
            <Breadcrumbs maxItems={3} sx={{ fontSize: 12 }}>
              <Link component="button" underline="hover" color="text.secondary" fontSize={12} onClick={() => browse("")}>
                磁碟機
              </Link>
              {breadcrumbs.map((part, i) => {
                const fullPath = breadcrumbs.slice(0, i + 1).join("\\") + (i === 0 ? "\\" : "");
                const isLast = i === breadcrumbs.length - 1;
                return isLast ? (
                  <Typography key={i} fontSize={12} color="text.primary">{part}</Typography>
                ) : (
                  <Link key={i} component="button" underline="hover" color="text.secondary" fontSize={12}
                    onClick={() => browse(fullPath)}>
                    {part}
                  </Link>
                );
              })}
            </Breadcrumbs>
          ) : (
            <Typography fontSize={12} color="text.secondary">磁碟機</Typography>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List dense disablePadding sx={{ maxHeight: 320, overflowY: "auto" }}>
            {current?.parent != null && (
              <ListItemButton onClick={() => browse(current.parent!)} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <ArrowUpwardIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText primary=".." primaryTypographyProps={{ fontSize: 13, color: "text.secondary" }} />
              </ListItemButton>
            )}
            {current?.children.map((entry) => (
              <ListItemButton key={entry.path} onClick={() => browse(entry.path)} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <FolderIcon fontSize="small" sx={{ color: "#f59e0b" }} />
                </ListItemIcon>
                <ListItemText primary={entry.name} primaryTypographyProps={{ fontSize: 13, noWrap: true }} />
              </ListItemButton>
            ))}
            {current?.children.length === 0 && (
              <Box sx={{ px: 2, py: 2 }}>
                <Typography fontSize={13} color="text.disabled">（空資料夾）</Typography>
              </Box>
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ gap: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, px: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.path || ""}
        </Typography>
        <Button size="small" onClick={onClose}>取消</Button>
        <Button
          size="small"
          variant="contained"
          disabled={!current?.path}
          onClick={() => { if (current?.path) { onSelect(current.path); onClose(); } }}
        >
          選擇此資料夾
        </Button>
      </DialogActions>
    </Dialog>
  );
}
