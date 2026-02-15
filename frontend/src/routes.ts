import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import HomePage from "./components/HomePage";
import AIAgentPage from "./components/AIAgentPage";
import StatsPage from "./components/StatsPage";
import ProfilePage from "./components/ProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: HomePage },
      { path: "ai-agent", Component: AIAgentPage },
      { path: "stats", Component: StatsPage },
      { path: "profile", Component: ProfilePage },
    ],
  },
]);
