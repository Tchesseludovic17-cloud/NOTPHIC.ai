import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TranslationProvider } from "@/hooks/use-translation";
import { LandingHeader } from "@/components/landing-header";
import { LandingFooter } from "@/components/landing-footer";
import { AdminReturn } from "@/components/admin-return";
import Landing from "@/pages/landing";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Alertes from "@/pages/alerts";
import Parametres from "@/pages/settings";
import SitePublic from "@/pages/site-public";
import Affiliations from "@/pages/affiliations";
import CompanyTwin from "@/pages/company-twin";
import Admin from "@/pages/admin";
import { useGetMe } from "@workspace/api-client-react";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#C0654A",
    colorForeground: "#3D2B1F",
    colorMutedForeground: "#8C6A5A",
    colorDanger: "#C0392B",
    colorBackground: "#FDF6EE",
    colorInput: "#F5EDE3",
    colorInputForeground: "#3D2B1F",
    colorNeutral: "#D4B8A8",
    fontFamily: "Georgia, serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#FDF6EE] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-[#D4B8A8]",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#3D2B1F] font-serif",
    headerSubtitle: "text-[#8C6A5A]",
    socialButtonsBlockButtonText: "text-[#3D2B1F]",
    formFieldLabel: "text-[#3D2B1F]",
    footerActionLink: "text-[#C0654A] hover:text-[#A0543C]",
    footerActionText: "text-[#8C6A5A]",
    dividerText: "text-[#8C6A5A]",
    identityPreviewEditButton: "text-[#C0654A]",
    formFieldSuccessText: "text-green-600",
    alertText: "text-[#3D2B1F]",
    logoBox: "mb-2",
    logoImage: "rounded-lg",
    socialButtonsBlockButton: "border-[#D4B8A8] bg-[#F5EDE3] hover:bg-[#EDD9C8]",
    formButtonPrimary: "bg-[#C0654A] hover:bg-[#A0543C] text-[#FDF6EE]",
    formFieldInput: "bg-[#F5EDE3] border-[#D4B8A8] text-[#3D2B1F]",
    footerAction: "bg-transparent",
    dividerLine: "bg-[#D4B8A8]",
    alert: "bg-[#F5EDE3] border-[#D4B8A8]",
    otpCodeFieldInput: "bg-[#F5EDE3] border-[#D4B8A8] text-[#3D2B1F]",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) qc.clear();
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function OnboardingOrDashboard() {
  const { data: user, isLoading, error } = useGetMe({ query: { retry: false } });
  if (isLoading) return null;
  if (error || !user || !user.slug) return <Redirect to="/onboarding" />;
  return <Redirect to="/dashboard" />;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><OnboardingOrDashboard /></Show>
      <Show when="signed-out"><Landing /></Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in"><Component /></Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <div className="flex-1">
        {children}
      </div>
      <LandingFooter />
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      {children}
      <AdminReturn />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <LandingLayout>
          <HomeRedirect />
        </LandingLayout>
      </Route>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/onboarding">
        <AppLayout>
          <ProtectedRoute component={Onboarding} />
        </AppLayout>
      </Route>
      <Route path="/dashboard">
        <AppLayout>
          <ProtectedRoute component={Dashboard} />
        </AppLayout>
      </Route>
      <Route path="/clients">
        <AppLayout>
          <ProtectedRoute component={Clients} />
        </AppLayout>
      </Route>
      <Route path="/alertes">
        <AppLayout>
          <ProtectedRoute component={Alertes} />
        </AppLayout>
      </Route>
      <Route path="/parametres">
        <AppLayout>
          <ProtectedRoute component={Parametres} />
        </AppLayout>
      </Route>
      <Route path="/affiliations">
        <AppLayout>
          <ProtectedRoute component={Affiliations} />
        </AppLayout>
      </Route>
      <Route path="/company-twin">
        <AppLayout>
          <ProtectedRoute component={CompanyTwin} />
        </AppLayout>
      </Route>
      <Route path="/admin">
        <AppLayout>
          <ProtectedRoute component={Admin} />
        </AppLayout>
      </Route>
      <Route path="/site/:slug" component={SitePublic} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: "Bienvenue sur Norphic", subtitle: "Connectez-vous à votre espace professionnel" } },
        signUp: { start: { title: "Créer votre compte Norphic", subtitle: "Rejoignez des centaines de professionnels indépendants" } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TranslationProvider>
            <ClerkQueryClientCacheInvalidator />
            <Router />
            <Toaster />
          </TranslationProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
