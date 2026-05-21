// `use` became a stable, first-class React API in React 19. This package
// targets React 19+ (see `peerDependencies`), so it re-exports `use` directly
// instead of shipping the React 18 thenable polyfill it previously carried.
export { use } from "react";
