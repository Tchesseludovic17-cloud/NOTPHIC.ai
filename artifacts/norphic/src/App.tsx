import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Alertes from "@/pages/alerts";
import Parametres from "@/pages/settings";
import SitePublic from "@/pages/site-public";
import Affiliations from "@/pages/affiliations";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Onboarding} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clients" component={Clients} />
      <Route path="/alertes" component={Alertes} />
      <Route path="/parametres" component={Parametres} />
      <Route path="/affiliations" component={Affiliations} />
      <Route path="/site/:slug" component={SitePublic} />
      <Route component={NotFound} />
    </Switch>
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