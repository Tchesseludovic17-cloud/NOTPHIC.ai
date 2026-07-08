export const translations = {
  en: {
    // Common
    loading: "Loading...",
    error: "Error",
    success: "Success",
    cancel: "Cancel",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    copy: "Copy",
    back: "Back",

    // Auth
    auth: {
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
    },

    // Dashboard
    dashboard: {
      title: "Dashboard",
      overview: "Overview",
      subtitle: "A close look at your client base.",
      totalClients: "Total Clients",
      activeAlerts: "Active Alerts",
      clientsAtRisk: "Clients at Risk",
      safeClients: "Safe Clients",
      recentAlerts: "Recent Alerts",
      seeAll: "See all",
      quickActions: "Quick Actions",
      yourPublicSite: "Your public site",
      viewSite: "View site",
      copyLink: "Copy link",
      linkCopied: "Link copied!",
      linkCopiedDesc: "Your site URL has been copied.",
      runAnalysis: "Run manual analysis",
      analysisRunning: "Analysis running...",
      analysisComplete: "Analysis complete",
      analysisError: "Unable to run analysis.",
      clientDirectory: "Client Directory",
      manageContacts: "Manage and add your contacts",
      noAlerts: "All clear, no alerts at the moment.",
    },

    // Clients
    clients: {
      title: "Clients",
      addClient: "Add Client",
      editClient: "Edit Client",
      deleteClient: "Delete Client",
      confirmDelete: "Are you sure you want to delete this client?",
      clientName: "Client Name",
      email: "Email",
      phone: "Phone",
      lastVisit: "Last Visit",
      nextAppointment: "Next Appointment",
      subscription: "Subscription",
      active: "Active",
      inactive: "Inactive",
      noClients: "No clients yet",
      addYourFirst: "Add your first client",
    },

    // Alerts
    alerts: {
      title: "Alerts",
      noAlerts: "No alerts",
      high: "High",
      medium: "Medium",
      low: "Low",
      markAsRead: "Mark as read",
      markAsUnread: "Mark as unread",
    },

    // Settings
    settings: {
      title: "Settings",
      profile: "Profile",
      preferences: "Preferences",
      language: "Language",
      theme: "Theme",
      darkMode: "Dark Mode",
      notifications: "Notifications",
    },

    // Navigation
    nav: {
      dashboard: "Dashboard",
      clients: "Clients",
      alerts: "Alerts",
      affiliations: "Affiliations",
      companyTwin: "Company Twin",
      settings: "Settings",
      admin: "Admin",
      logout: "Logout",
    },

    // Landing Page
    landing: {
      hero: {
        title: "Welcome to Norphic",
        subtitle: "The intelligent platform to manage your clients, detect risks and maximize your growth opportunities.",
        cta: "Get Started Free",
      },
      features: {
        title: "Key Features",
      },
      footer: {
        tagline: "Smart client management for independent professionals.",
        product: "Product",
        company: "Company",
        legal: "Legal",
        rights: "All rights reserved.",
      },
    },
  },
  fr: {
    // Common
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    cancel: "Annuler",
    save: "Enregistrer",
    delete: "Supprimer",
    edit: "Modifier",
    add: "Ajouter",
    copy: "Copier",
    back: "Retour",

    // Auth
    auth: {
      signIn: "Se connecter",
      signUp: "S'inscrire",
      signOut: "Déconnexion",
    },

    // Dashboard
    dashboard: {
      title: "Tableau de bord",
      overview: "Vue d'ensemble",
      subtitle: "Un regard attentif sur votre base de clients.",
      totalClients: "Total Clients",
      activeAlerts: "Alertes Actives",
      clientsAtRisk: "Clients à risque",
      safeClients: "Clients sereins",
      recentAlerts: "Alertes récentes",
      seeAll: "Tout voir",
      quickActions: "Actions rapides",
      yourPublicSite: "Votre site public",
      viewSite: "Voir le site",
      copyLink: "Copier",
      linkCopied: "Lien copié !",
      linkCopiedDesc: "L'URL de votre site a été copiée.",
      runAnalysis: "Lancer l'analyse manuelle",
      analysisRunning: "Analyse en cours...",
      analysisComplete: "Analyse terminée",
      analysisError: "Impossible d'exécuter l'analyse.",
      clientDirectory: "Annuaire clients",
      manageContacts: "Gérer et ajouter vos contacts",
      noAlerts: "Tout va bien, aucune alerte pour le moment.",
    },

    // Clients
    clients: {
      title: "Clients",
      addClient: "Ajouter un client",
      editClient: "Modifier le client",
      deleteClient: "Supprimer le client",
      confirmDelete: "Êtes-vous sûr de vouloir supprimer ce client ?",
      clientName: "Nom du client",
      email: "Email",
      phone: "Téléphone",
      lastVisit: "Dernière visite",
      nextAppointment: "Prochain rendez-vous",
      subscription: "Abonnement",
      active: "Actif",
      inactive: "Inactif",
      noClients: "Aucun client pour le moment",
      addYourFirst: "Ajouter votre premier client",
    },

    // Alerts
    alerts: {
      title: "Alertes",
      noAlerts: "Aucune alerte",
      high: "Haute",
      medium: "Moyenne",
      low: "Basse",
      markAsRead: "Marquer comme lu",
      markAsUnread: "Marquer comme non lu",
    },

    // Settings
    settings: {
      title: "Paramètres",
      profile: "Profil",
      preferences: "Préférences",
      language: "Langue",
      theme: "Thème",
      darkMode: "Mode sombre",
      notifications: "Notifications",
    },

    // Navigation
    nav: {
      dashboard: "Tableau de bord",
      clients: "Clients",
      alerts: "Alertes",
      affiliations: "Affiliations",
      companyTwin: "Company Twin",
      settings: "Paramètres",
      admin: "Admin",
      logout: "Déconnexion",
    },

    // Landing Page
    landing: {
      hero: {
        title: "Bienvenue sur Norphic",
        subtitle: "La plateforme intelligente pour gérer vos clients, détecter les risques et maximiser vos opportunités de croissance.",
        cta: "Commencer gratuitement",
      },
      features: {
        title: "Fonctionnalités principales",
      },
      footer: {
        tagline: "Gestion intelligente des clients pour les professionnels indépendants.",
        product: "Produit",
        company: "Entreprise",
        legal: "Légal",
        rights: "Tous droits réservés.",
      },
    },
  },
} as const;

export type Language = "en" | "fr";
export type TranslationKeys = typeof translations.en;
