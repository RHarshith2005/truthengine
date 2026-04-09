import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

// Don't use React.StrictMode for authentication flows - it causes mount/unmount issues with popups
ReactDOM.createRoot(document.getElementById("root")).render(
  <App />
);
