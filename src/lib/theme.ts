// هوية "وكالة قنديل" البصرية — أربعة ألوان فقط، بدون أي إضافة خارجية.
export const BRAND = {
  navy: "#001327",
  teal: "#19A4C2",
  amber: "#CDD44B",
  deepTeal: "#093A4F",
  pearl: "#F4FAF8",
} as const;

export const BRAND_RGB = {
  navy: [0x00 / 255, 0x13 / 255, 0x27 / 255] as [number, number, number],
  teal: [0x19 / 255, 0xa4 / 255, 0xc2 / 255] as [number, number, number],
  amber: [0xcd / 255, 0xd4 / 255, 0x4b / 255] as [number, number, number],
  deepTeal: [0x09 / 255, 0x3a / 255, 0x4f / 255] as [number, number, number],
  pearl: [0xf4 / 255, 0xfa / 255, 0xf8 / 255] as [number, number, number],
};
