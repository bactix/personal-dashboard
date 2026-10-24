import { createLucideIcon } from "lucide-react"

/** A cow's head, drawn in the Lucide style (24px grid, 2px stroke) since Lucide has no cow. */
export const CowIcon = createLucideIcon("Cow", [
  // horns
  ["path", { d: "M7 6C5 5.5 3.5 4 3.5 2.5", key: "horn-left" }],
  ["path", { d: "M17 6c2-.5 3.5-2 3.5-3.5", key: "horn-right" }],
  // ears
  ["path", { d: "M7 8C5 7 3 7 2 8c.5 2 2 3 4 3", key: "ear-left" }],
  ["path", { d: "M17 8c2-1 4-1 5 0-.5 2-2 3-4 3", key: "ear-right" }],
  // head
  ["path", { d: "M7 6h10v8.5c0 3-2 5.5-5 5.5s-5-2.5-5-5.5z", key: "head" }],
  // nostrils and eyes
  ["path", { d: "M10.5 16.5h.01", key: "nostril-left" }],
  ["path", { d: "M13.5 16.5h.01", key: "nostril-right" }],
  ["path", { d: "M9.5 11h.01", key: "eye-left" }],
  ["path", { d: "M14.5 11h.01", key: "eye-right" }],
]);
