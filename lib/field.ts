// Shared scroll state for the WebGL grain field. Sections tween `stage`; the canvas reads it every frame.
// 0 falling in, 1 logo, 2 drifting, 3 heap. `on` is false once the field is scrolled past.
// `intro` is the opening pour (0 to 1) on its own value, so it can never overwrite where the scroll has got to.
export const field = { stage: 0, intro: 0, on: true };
