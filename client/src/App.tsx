import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardHome from "./pages/DashboardHome";
import AIChatAgent from "./pages/AIChatAgent";
import ImageGeneration from "./pages/ImageGeneration";
import WorkflowAutomation from "./pages/WorkflowAutomation";
import ScheduledTasks from "./pages/ScheduledTasks";
import TaskHistory from "./pages/TaskHistory";
import Settings from "./pages/Settings";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
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
