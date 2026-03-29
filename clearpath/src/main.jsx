import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Dashboard from "./Dashboard.jsx";
import Analytics from "./Analytics.jsx";

const path = window.location.pathname;

const Page = path === "/dashboard" ? Dashboard
           : path === "/analytics" ? Analytics
           : App;

ReactDOM.createRoot(document.getElementById("root")).render(<Page />);