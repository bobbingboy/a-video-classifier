import { useState } from "react";
import {
  Autocomplete,
  Box,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import type { TagFacet } from "../api/videos";

const VISIBLE_COUNT = 8;

interface Props {
  selectedTags: string[];
  tagFacets: TagFacet[];
  totalCount: number;
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
}

export default function TagFacetBar({
  selectedTags,
  tagFacets,
  totalCount,
  onAdd,
  onRemove,
}: Props) {
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  const availableFacets = tagFacets.filter(
    (f) => !selectedTags.includes(f.name),
  );
  const visibleFacets = availableFacets.slice(0, VISIBLE_COUNT);
  const hasMore = availableFacets.length > VISIBLE_COUNT;

  return (
    <LayoutGroup>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {/* Selected tags */}
        {selectedTags.length > 0 && (
          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
            <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>
              已篩選：
            </Typography>
            <AnimatePresence>
              {selectedTags.map((name) => (
                <motion.div
                  key={name}
                  layoutId={`tag-${name}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Chip
                    label={name}
                    size="small"
                    color="primary"
                    onDelete={() => onRemove(name)}
                    sx={{ fontSize: 12 }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>
              共 {totalCount} 部
            </Typography>
          </Box>
        )}

        {/* Available tags */}
        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
          {selectedTags.length > 0 && (
            <Typography variant="caption" color="text.disabled" sx={{ mr: 0.5 }}>
              加入條件：
            </Typography>
          )}
          <AnimatePresence>
            {visibleFacets.map((f) => (
              <motion.div
                key={f.name}
                layoutId={`tag-${f.name}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                <Chip
                  label={`${f.name} (${f.count})`}
                  size="small"
                  onClick={() => onAdd(f.name)}
                  disabled={f.count === 0}
                  sx={{
                    fontSize: 11,
                    height: 24,
                    cursor: f.count === 0 ? "default" : "pointer",
                    bgcolor: "action.selected",
                    "&:hover": { bgcolor: "action.hover" },
                    ...(f.count === 0 && { opacity: 0.4 }),
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {(hasMore || showAutocomplete) && (
            showAutocomplete ? (
              <Autocomplete
                size="small"
                options={availableFacets}
                getOptionLabel={(o) => `${o.name} (${o.count})`}
                getOptionDisabled={(o) => o.count === 0}
                onChange={(_, val) => {
                  if (val) {
                    onAdd(val.name);
                    setShowAutocomplete(false);
                  }
                }}
                onBlur={() => setShowAutocomplete(false)}
                openOnFocus
                autoHighlight
                sx={{ minWidth: 180 }}
                renderInput={(params) => (
                  <TextField {...params} placeholder="搜尋分類..." autoFocus size="small" />
                )}
              />
            ) : (
              <Chip
                icon={<AddIcon sx={{ fontSize: 14 }} />}
                label="更多"
                size="small"
                onClick={() => setShowAutocomplete(true)}
                sx={{ fontSize: 11, height: 24, cursor: "pointer" }}
              />
            )
          )}
        </Box>
      </Box>
    </LayoutGroup>
  );
}
