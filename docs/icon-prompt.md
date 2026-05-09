# Guardian App Icon — Image Generation Prompt

## Prompt

> A minimal, geometric app icon of a closed padlock on a dark background. Flat design, 2 colors: dark charcoal background (#0D1117) and a single bold crimson accent (#C23152). The padlock is closed — the U-shaped shackle descends into the rectangular lock body, forming one unified silhouette. A small keyhole cutout in negative space on the body. Clean vector-style shapes, no gradients, no shadows, no 3D effects, no text. Bold geometry with thick strokes that remain legible at 16×16 pixels. Style inspired by Linear, Raycast, and 1Password app icons — corporate-grade minimalism. Square canvas with rounded corners. Symmetric, centered, perfectly balanced.

## Negative prompt

> gradient, 3d, shadow, drop shadow, realistic, photograph, text, letters, words, open padlock, unlocked, unlocked shackle, multiple colors, colorful, busy, detailed, ornate, skeuomorphic, glass, glossy, bevel, emboss

## Design constraints

- **Canvas:** 512×512, square with rounded corners (iOS/macOS icon shape)
- **Colors:** exactly 2 — `#0D1117` (GitHub dark) + `#C23152` (deep crimson)
- **Subject:** closed padlock — shackle must visually connect INTO the body (locked state)
- **Style:** flat, geometric, vector-quality — no raster artifacts
- **Legibility:** must read as "padlock" at 16×16px (macOS menu bar size)
- **Vibe:** security tool for developers — serious, trustworthy, bold

## Reference aesthetic

- **Linear** (linear.app) — clean shapes, single accent color on dark
- **1Password** — bold lock icon, minimal palette
- **Raycast** — geometric, dark background, vivid accent
- **Arc Browser** — simple shape, memorable silhouette

## Post-generation

1. Remove background if any — must be transparent or solid `#0D1117`
2. Resize to exactly 512×512
3. Verify at 32px and 16px — silhouette must remain readable
4. Convert to PNG
5. Save as `command-icon.png`
