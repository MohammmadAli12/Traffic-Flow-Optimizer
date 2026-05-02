import { AppLayout } from "@/components/layout";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Dashboard } from "./pages/dashboard";
import { Intersections } from "./pages/intersections";
import { IntersectionDetail } from "./pages/intersection-detail";
import { Ambulances } from "./pages/ambulances";
import { Hospitals } from "./pages/hospitals";
import { LucknowMap } from "./pages/map";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/intersections" component={Intersections} />
        <Route path="/intersections/:id" component={IntersectionDetail} />
        <Route path="/ambulances" component={Ambulances} />
        <Route path="/hospitals" component={Hospitals} />
        <Route path="/map" component={LucknowMap} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
