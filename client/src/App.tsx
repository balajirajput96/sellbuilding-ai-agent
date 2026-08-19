import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { DashboardLayoutSkeleton } from "./components/DashboardLayoutSkeleton";
import { ThemeProvider } from "./contexts/ThemeContext";

const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const AIChatAgent = lazy(() => import("./pages/AIChatAgent"));
const ImageGeneration = lazy(() => import("./pages/ImageGeneration"));
const WorkflowAutomation = lazy(() => import("./pages/WorkflowAutomation"));
const ScheduledTasks = lazy(() => import("./pages/ScheduledTasks"));
const TaskHistory = lazy(() => import("./pages/TaskHistory"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Suspense fallback={<DashboardLayoutSkeleton />}>
      <Switch>
        <Route path={"/"} component={DashboardHome} />
        <Route path={"/ai-chat-agent"} component={AIChatAgent} />
        <Route path={"/image-generation"} component={ImageGeneration} />
        <Route path={"/workflow-automation"} component={WorkflowAutomation} />
        <Route path={"/scheduled-tasks"} component={ScheduledTasks} />
        <Route path={"/task-history"} component={TaskHistory} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
