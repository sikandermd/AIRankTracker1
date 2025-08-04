import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import Dashboard from "@/pages/dashboard";
import Analytics from "@/pages/analytics";
import Keywords from "@/pages/keywords";
import OrganicKeywords from "@/pages/organic-keywords";
import TopPages from "./pages/top-pages";
import AlertsPage from "@/pages/AlertsPage";
import CombinedAlerts from "./pages/CombinedAlerts";
import SeoRecommendations from "./pages/SeoRecommendations";
import NotFound from "@/pages/not-found";
import PasswordGuard from "@/components/PasswordGuard";

function Router() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex-1 space-y-4 p-8 pt-6">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/keywords" component={Keywords} />
            <Route path="/organic" component={OrganicKeywords} />
            <Route path="/organic/top-pages" component={TopPages} />
            <Route path="/alerts" component={AlertsPage} />
            <Route path="/combined-alerts" component={CombinedAlerts} />
            <Route path="/ml-recommendations" component={SeoRecommendations} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PasswordGuard>
          <Router />
        </PasswordGuard>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
