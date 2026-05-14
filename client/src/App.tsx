import { Toaster } from "@/components/ui/sonner";
import Patient from "./pages/Patient";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Family from "./pages/Family";
import Reports from "./pages/Reports";
import Pharmacy from "./pages/Pharmacy";
import SettingsPage from "./pages/Settings";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
    <Route path={"/patient"} component={Patient} />
    <Route path={"/family"} component={Family} />
    <Route path={"/reports"} component={Reports} />
    <Route path={"/pharmacy"} component={Pharmacy} />
    <Route path={"/settings"} component={SettingsPage} />
      <Route path={"/dashboard"} component={Home} />
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
        defaultTheme="light"
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
