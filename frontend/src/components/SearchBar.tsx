import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: Props) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 300);
    return () => clearTimeout(t);
  }, [local]);

  return (
    <input
      type="text"
      placeholder="搜尋番號、標題、演員..."
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      style={{
        width: "100%",
        padding: "8px 12px",
        fontSize: "14px",
        border: "1px solid #444",
        borderRadius: "6px",
        background: "#1a1a1a",
        color: "#fff",
        outline: "none",
      }}
    />
  );
}
