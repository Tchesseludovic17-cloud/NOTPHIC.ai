import { useAuth } from "@clerk/react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export function LandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation("/dashboard");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  if (!isLoaded || isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-20 px-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-6">
            Bienvenue sur <span className="text-primary">Norphic</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            La plateforme intelligente pour gérer vos clients, détecter les risques et maximiser vos opportunités de croissance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/sign-up" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition">
              Commencer gratuitement
            </a>
            <a href="/sign-in" className="inline-flex items-center justify-center px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition">
              Se connecter
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-serif font-bold text-center text-foreground mb-16">
            Fonctionnalités principales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Historique */}
            <div className="bg-card rounded-2xl border border-border p-8 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Historique complet</h3>
              <p className="text-muted-foreground">
                Suivi détaillé de toutes les interactions avec vos clients. Chaque relance, chaque contact est archivé et accessible.
              </p>
            </div>

            {/* Feature 2: Vue d'ensemble */}
            <div className="bg-card rounded-2xl border border-border p-8 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Tableau de bord intuitif</h3>
              <p className="text-muted-foreground">
                Une vue d'ensemble claire de vos clients, alertes actives et efficacité de vos relances en un coup d'œil.
              </p>
            </div>

            {/* Feature 3: Mémoire */}
            <div className="bg-card rounded-2xl border border-border p-8 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">💾</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">M��moire de votre activité</h3>
              <p className="text-muted-foreground">
                Une trace complète de votre parcours professionnel. Statistiques, tendances et insights pour optimiser votre business.
              </p>
            </div>

            {/* Feature 4: Alertes */}
            <div className="bg-card rounded-2xl border border-border p-8 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚨</span>
              </div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">Signaux d'alerte intelligents</h3>
              <p className="text-muted-foreground">
                Détection automatique des clients à risque. Inactivité, baisse d'activité, ou départ potentiel imminent.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-serif font-bold text-center text-foreground mb-16">
            Comment ça marche
          </h2>

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Inscrivez-vous en 2 minutes</h3>
                <p className="text-muted-foreground">Créez votre compte gratuitement et configurez votre profil professionnel.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Importez vos clients</h3>
                <p className="text-muted-foreground">Ajoutez vos clients et leurs informations de contact. Notre système apprend vos interactions.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Recevez des alertes</h3>
                <p className="text-muted-foreground">Identifiez automatiquement les clients à risque et les opportunités de relance.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Augmentez vos revenus</h3>
                <p className="text-muted-foreground">Agissez rapidement et conservez vos clients plus longtemps grâce à Norphic.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-2xl bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl border border-primary/20 p-12 text-center">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Prêt à transformer votre gestion client ?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Rejoignez des centaines de professionnels indépendants qui font confiance à Norphic.
          </p>
          <a href="/sign-up" className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition">
            Commencer gratuitement
          </a>
        </div>
      </section>
    </div>
  );
}
