// ============================================================
//  portalConfig.ts  —  Janatics Enterprise Portal Platform
//  Covers: layout modes, sidebar, header, tabs, nav, theme,
//  auth, permissions, branding, widgets & page defaults.
// ============================================================

import type { ComponentType, ReactNode } from "react";

// ─────────────────────────────────────────────
// 1. PRIMITIVE TYPES
// ─────────────────────────────────────────────

export type IconName = string; // lucide-react icon name or custom SVG key
export type RoutePattern = `/${string}`; // must start with /
export type PermissionKey = string; // e.g. "PORTAL_VIEW", "REPORT_EXPORT"
export type ThemeToken = string; // CSS variable key, e.g. "--color-primary"
export type LocaleCode = "en" | "ta" | "hi" | "de" | "fr" | string;
export type EnvironmentTag = "development" | "staging" | "production";

// ─────────────────────────────────────────────
// 2. LAYOUT MODES
// ─────────────────────────────────────────────

/**
 * Layout mode for the portal shell.
 *
 * - "sidebar-header"      : Classic ERP layout — fixed sidebar + top header.
 * - "header-tabs"         : SaaS layout — sticky header with tab bar & dropdown child menus.
 * - "sidebar-only"        : Sidebar navigation only, no top header (kiosk / embedded).
 * - "header-only"         : Minimal header nav, no sidebar (marketing / landing portals).
 * - "fullscreen"          : No chrome — used for reports, presentations, public embeds.
 */
export type LayoutMode =
  | "sidebar-header"
  | "header-tabs"
  | "sidebar-only"
  | "header-only"
  | "fullscreen";

// ─────────────────────────────────────────────
// 3. SIDEBAR CONFIG
// ─────────────────────────────────────────────

export interface SidebarItemBadge {
  label: string; // "New" | "99+" | count string
  variant: "count" | "dot" | "text";
  color?: "primary" | "success" | "warning" | "danger"; // defaults to primary
}

export interface SidebarChildItem {
  key: string;
  label: string;
  icon?: IconName;
  route: RoutePattern;
  permissions?: PermissionKey[];
  hidden?: boolean;
  badge?: SidebarItemBadge;
  /** Mark as external link — opens in new tab */
  external?: boolean;
  /** Exact match for active state highlight */
  exactMatch?: boolean;
}

export interface SidebarItem {
  key: string;
  label: string;
  icon: IconName; // required at top level
  route?: RoutePattern; // omit for group-only items
  permissions?: PermissionKey[];
  hidden?: boolean;
  badge?: SidebarItemBadge;
  children?: SidebarChildItem[];
  /** Visually group items with a divider above */
  groupLabel?: string;
  /** Disable this item but still render it (greyed out) */
  disabled?: boolean;
  /** Tooltip shown on collapsed sidebar hover */
  tooltip?: string;
  /** Open children in a fly-out popover when sidebar is collapsed */
  flyoutOnCollapse?: boolean;
}

export interface SidebarConfig {
  /** Show/hide the sidebar */
  enabled: boolean;

  /** Default width in px (expanded) */
  width: number;

  /** Width in px when collapsed to icon-only rail */
  collapsedWidth: number;

  /** Default state on page load */
  defaultState: "expanded" | "collapsed" | "hidden";

  /** Allow user to toggle collapse via button */
  collapsible: boolean;

  /** Persist collapse state in localStorage */
  persistState: boolean;

  /** localStorage key for persisting state */
  persistKey?: string;

  /** Position of the sidebar */
  position: "left" | "right";

  /** Show portal logo / branding inside sidebar header area */
  showBranding: boolean;

  /** Fixed (doesn't scroll) or scrollable */
  fixed: boolean;

  /** Show tooltip labels on collapsed icon rail */
  showTooltipsWhenCollapsed: boolean;

  /** Show expand/collapse toggle button at bottom of sidebar */
  showCollapseToggle: boolean;

  /** Show user avatar + name at bottom of sidebar */
  showUserFooter: boolean;

  /** Auto-collapse sidebar on mobile breakpoints */
  autoCollapseOnMobile: boolean;

  /** Breakpoint (px) below which sidebar auto-collapses */
  mobileBreakpoint: number;

  /** Overlay mode: sidebar overlaps content rather than pushing it */
  overlayOnMobile: boolean;

  /** Highlight style for active nav item */
  activeItemStyle: "filled" | "left-border" | "pill" | "underline";

  /** Indent level for nested child items (px) */
  childIndent: number;

  /** Show icons on child/nested items */
  showChildIcons: boolean;

  /** Accordion: collapse other groups when one opens */
  accordionMode: boolean;

  /** Array of sidebar navigation items */
  items: SidebarItem[];
}

// ─────────────────────────────────────────────
// 4. HEADER CONFIG
// ─────────────────────────────────────────────

export interface HeaderActionButton {
  key: string;
  icon: IconName;
  label: string; // used for aria-label and tooltip
  tooltip?: string;
  badge?: SidebarItemBadge;
  onClick?: string; // action key handled by portal action dispatcher
  permissions?: PermissionKey[];
  hidden?: boolean;
  /** Render a custom component instead */
  componentKey?: string;
}

export interface HeaderDropdownItem {
  key: string;
  label: string;
  icon?: IconName;
  route?: RoutePattern;
  onClick?: string;
  dividerBefore?: boolean;
  permissions?: PermissionKey[];
  hidden?: boolean;
  danger?: boolean; // e.g. "Sign out" item
}

export interface HeaderUserMenuConfig {
  show: boolean;
  showAvatar: boolean;
  showName: boolean;
  showEmail: boolean;
  showRole: boolean;
  avatarFallback: "initials" | "icon" | "placeholder";
  items: HeaderDropdownItem[];
}

export interface HeaderNotificationsConfig {
  show: boolean;
  icon: IconName;
  /** Poll interval in ms; 0 = WebSocket / push only */
  pollIntervalMs: number;
  maxVisible: number;
  showMarkAllRead: boolean;
  soundEnabled: boolean;
  groupByType: boolean;
}

export interface HeaderSearchConfig {
  show: boolean;
  placeholder: string;
  /** "global" searches across all portals; "local" scoped to current portal */
  scope: "global" | "local";
  shortcut?: string; // e.g. "Ctrl+K"
  expandOnFocus: boolean;
  maxResults: number;
  debounceMs: number;
}

export interface HeaderConfig {
  enabled: boolean;
  height: number; // px
  fixed: boolean;
  showLogo: boolean;
  showPortalName: boolean;
  showBreadcrumbs: boolean;
  showSearch: HeaderSearchConfig;
  showNotifications: HeaderNotificationsConfig;
  userMenu: HeaderUserMenuConfig;
  /** Action icon buttons to the right of search */
  actionButtons: HeaderActionButton[];
  /** Show environment badge (DEV / STG) */
  showEnvironmentBadge: boolean;
  /** Show a "help" button linking to docs */
  showHelpButton: boolean;
  helpUrl?: string;
}

// ─────────────────────────────────────────────
// 5. TAB BAR CONFIG (header-tabs layout)
// ─────────────────────────────────────────────

export interface TabChildMenuItem {
  key: string;
  label: string;
  icon?: IconName;
  route: RoutePattern;
  permissions?: PermissionKey[];
  hidden?: boolean;
  badge?: SidebarItemBadge;
  /** Show a keyboard shortcut hint in dropdown */
  shortcut?: string;
}

export interface TabItem {
  key: string;
  label: string;
  icon?: IconName;
  route?: RoutePattern; // if omitted, first child route is used
  permissions?: PermissionKey[];
  hidden?: boolean;
  badge?: SidebarItemBadge;
  /** Dropdown child menu */
  children?: TabChildMenuItem[];
  /** Mega-menu columns: group children into labelled columns */
  megaMenu?: {
    enabled: boolean;
    columns: Array<{
      heading: string;
      items: TabChildMenuItem[];
    }>;
  };
  /** Pin this tab so it can't be closed/reordered */
  pinned?: boolean;
  /** Exact route match for active highlight */
  exactMatch?: boolean;
}

export interface TabBarConfig {
  enabled: boolean;
  position: "below-header" | "inside-header";
  scrollable: boolean;
  showIcons: boolean;
  /** Underline / filled pill / border-bottom */
  activeStyle: "underline" | "filled" | "border-bottom" | "text-bold";
  /** Show a "More" overflow dropdown when tabs don't fit */
  showOverflowMenu: boolean;
  /** Animate the active indicator */
  animateIndicator: boolean;
  items: TabItem[];
}

// ─────────────────────────────────────────────
// 6. FOOTER CONFIG
// ─────────────────────────────────────────────

export interface FooterLink {
  label: string;
  url: string;
  external?: boolean;
}

export interface FooterConfig {
  enabled: boolean;
  fixed: boolean;
  height: number;
  showCopyright: boolean;
  copyrightText?: string;
  showVersion: boolean;
  showLinks: boolean;
  links: FooterLink[];
  showEnvironmentInfo: boolean;
}

// ─────────────────────────────────────────────
// 7. THEME CONFIG
// ─────────────────────────────────────────────

export type ColorScheme = "light" | "dark" | "system";
export type BorderRadius = "none" | "sm" | "md" | "lg" | "full";
export type FontSize = "xs" | "sm" | "md" | "lg";
export type Density = "compact" | "comfortable" | "spacious";

export interface ThemeConfig {
  colorScheme: ColorScheme;
  /** Allow user to toggle dark/light mode */
  allowUserThemeToggle: boolean;
  /** Persist user theme choice */
  persistTheme: boolean;

  primaryColor: string; // hex
  primaryColorDark?: string; // override for dark mode
  accentColor: string;
  dangerColor: string;
  successColor: string;
  warningColor: string;
  infoColor: string;

  fontFamily: string; // CSS font-family string
  fontSize: FontSize;
  borderRadius: BorderRadius;
  density: Density;

  /** Allow user to change density */
  allowDensityToggle: boolean;

  /** Custom CSS variable overrides */
  cssVariables?: Record<ThemeToken, string>;

  /** Sidebar-specific colors */
  sidebar: {
    background: string;
    text: string;
    activeBackground: string;
    activeText: string;
    hoverBackground: string;
    border: string;
  };

  /** Header-specific colors */
  header: {
    background: string;
    text: string;
    border: string;
  };
}

// ─────────────────────────────────────────────
// 8. BRANDING CONFIG
// ─────────────────────────────────────────────

export interface BrandingConfig {
  appName: string;
  appTagline?: string;
  logoUrl: string; // light-mode logo
  logoDarkUrl?: string; // dark-mode logo (fallback: logoUrl)
  faviconUrl: string;
  logoWidth: number; // px
  logoHeight: number; // px
  showLogoText: boolean; // show appName next to logo
  /** Compact logo (icon only) used in collapsed sidebar */
  logoCompactUrl?: string;
  /** Loading screen splash logo */
  splashLogoUrl?: string;
}

// ─────────────────────────────────────────────
// 9. AUTH & PERMISSIONS CONFIG
// ─────────────────────────────────────────────

export type AuthStrategy = "jwt" | "session" | "oauth2" | "saml" | "none";

export interface AuthConfig {
  strategy: AuthStrategy;
  loginRoute: RoutePattern;
  logoutRoute: RoutePattern;
  /** Route to redirect after successful login */
  postLoginRedirect: RoutePattern;
  /** Route to redirect after logout */
  postLogoutRedirect: RoutePattern;
  /** Redirect unauthenticated users to loginRoute */
  requireAuth: boolean;
  /** JWT localStorage key */
  tokenKey?: string;
  /** JWT refresh token localStorage key */
  refreshTokenKey?: string;
  /** Auto-refresh token N ms before expiry */
  refreshBufferMs?: number;
  /** Session timeout warning dialog (ms before expiry) */
  sessionWarningMs?: number;
  /** Permitted roles that can access this portal */
  allowedRoles?: string[];
  /** Forbidden route fallback */
  unauthorizedRoute: RoutePattern;
  /** Not-found route */
  notFoundRoute: RoutePattern;
}

// ─────────────────────────────────────────────
// 10. PAGE DEFAULTS CONFIG
// ─────────────────────────────────────────────

export interface PageDefaultsConfig {
  /** Default document title suffix: "{Page Name} | {suffix}" */
  titleSuffix: string;
  /** Show a page-level loading skeleton */
  showPageSkeleton: boolean;
  /** Default page transition animation */
  transition: "none" | "fade" | "slide-up" | "slide-right";
  /** Show page header (title + breadcrumbs + action area) */
  showPageHeader: boolean;
  /** Show "Back" button in page header */
  showBackButton: boolean;
  /** Default padding inside page content area */
  contentPadding: "none" | "sm" | "md" | "lg";
  /** Max content width (px or "full") */
  maxContentWidth: number | "full";
  /** Scroll behaviour */
  scrollRestore: boolean;
}

// ─────────────────────────────────────────────
// 11. BREADCRUMB CONFIG
// ─────────────────────────────────────────────

export interface BreadcrumbConfig {
  enabled: boolean;
  separator: "/" | ">" | "›" | "·" | ReactNode;
  showHome: boolean;
  homeIcon?: IconName;
  homeLabel?: string;
  maxItems: number; // collapse middle items beyond this
  showCurrentPage: boolean;
}

// ─────────────────────────────────────────────
// 12. NOTIFICATIONS / TOAST CONFIG
// ─────────────────────────────────────────────

export interface ToastConfig {
  enabled: boolean;
  position:
    | "top-right"
    | "top-left"
    | "top-center"
    | "bottom-right"
    | "bottom-left"
    | "bottom-center";
  duration: number; // ms; 0 = persist until dismissed
  maxVisible: number;
  showProgress: boolean;
  pauseOnHover: boolean;
  closeOnClick: boolean;
}

// ─────────────────────────────────────────────
// 13. ERROR BOUNDARY CONFIG
// ─────────────────────────────────────────────

export interface ErrorConfig {
  /** Custom error boundary component key */
  errorBoundaryComponentKey?: string;
  /** Show stack trace in development */
  showStackInDev: boolean;
  /** Send errors to monitoring (Sentry etc.) */
  reportErrors: boolean;
  errorReportingDsn?: string;
  /** Fallback route on unrecoverable error */
  fallbackRoute: RoutePattern;
}

// ─────────────────────────────────────────────
// 14. ANALYTICS CONFIG
// ─────────────────────────────────────────────

export interface AnalyticsConfig {
  enabled: boolean;
  provider: "gtm" | "ga4" | "mixpanel" | "custom" | "none";
  trackingId?: string;
  trackPageViews: boolean;
  trackClicks: boolean;
  trackErrors: boolean;
  anonymizeIp: boolean;
}

// ─────────────────────────────────────────────
// 15. LOCALE / I18N CONFIG
// ─────────────────────────────────────────────

export interface LocaleConfig {
  defaultLocale: LocaleCode;
  supportedLocales: LocaleCode[];
  allowUserLocaleToggle: boolean;
  persistLocale: boolean;
  dateFormat: string; // e.g. "DD/MM/YYYY"
  timeFormat: "12h" | "24h";
  currency: string; // ISO 4217, e.g. "INR"
  numberLocale: string; // Intl locale string, e.g. "en-IN"
}

// ─────────────────────────────────────────────
// 16. FEATURE FLAGS
// ─────────────────────────────────────────────

export interface FeatureFlags {
  enableDarkMode: boolean;
  enableGlobalSearch: boolean;
  enableNotifications: boolean;
  enableBreadcrumbs: boolean;
  enableAnalytics: boolean;
  enableHelpDesk: boolean;
  enablePortalSwitcher: boolean;
  enableMultiLanguage: boolean;
  enableAuditLog: boolean;
  enablePrintMode: boolean;
  /** Any custom feature flags specific to this portal */
  [key: string]: boolean;
}

// ─────────────────────────────────────────────
// 17. PORTAL SWITCHER CONFIG
// ─────────────────────────────────────────────

export interface PortalSwitcherEntry {
  portalId: string;
  label: string;
  description?: string;
  iconUrl?: string;
  icon?: IconName;
  route: RoutePattern;
  permissions?: PermissionKey[];
  hidden?: boolean;
  /** Open in new tab */
  newTab?: boolean;
}

export interface PortalSwitcherConfig {
  enabled: boolean;
  /** Where to render the switcher button */
  position: "sidebar-header" | "header-left" | "header-right" | "sidebar-footer";
  style: "dropdown" | "modal" | "drawer";
  showDescriptions: boolean;
  showIcons: boolean;
  portals: PortalSwitcherEntry[];
}

// ─────────────────────────────────────────────
// 18. WIDGET REGISTRY CONFIG
// ─────────────────────────────────────────────

/**
 * Widgets are pluggable UI units registered here and
 * referenced by key in page configs or dashboard layouts.
 */
export interface WidgetRegistryEntry {
  key: string;
  label: string;
  description?: string;
  /** Lazy-loaded component path (used by import.meta.glob resolver) */
  componentPath: string;
  /** Default dimensions on a dashboard grid */
  defaultColSpan?: number;
  defaultRowSpan?: number;
  minColSpan?: number;
  minRowSpan?: number;
  resizable?: boolean;
  permissions?: PermissionKey[];
  /** Default props passed to component */
  defaultProps?: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// 19. DASHBOARD LAYOUT CONFIG
// ─────────────────────────────────────────────

export interface DashboardWidgetPlacement {
  widgetKey: string;
  colStart: number;
  rowStart: number;
  colSpan: number;
  rowSpan: number;
  props?: Record<string, unknown>;
}

export interface DashboardLayoutConfig {
  columns: number; // grid columns, e.g. 12
  rowHeight: number; // px
  gap: number; // px between widgets
  allowUserCustomization: boolean;
  persistLayout: boolean;
  persistKey?: string;
  defaultWidgets: DashboardWidgetPlacement[];
}

// ─────────────────────────────────────────────
// 20. API CONFIG
// ─────────────────────────────────────────────

export interface ApiConfig {
  baseUrl: string;
  timeout: number; // ms
  retryAttempts: number;
  retryDelayMs: number;
  withCredentials: boolean;
  /** Global headers sent with every request */
  defaultHeaders?: Record<string, string>;
  /** Endpoint for health check */
  healthCheckUrl?: string;
}

// ─────────────────────────────────────────────
// 21. ROOT PORTAL CONFIG
// ─────────────────────────────────────────────

export interface PortalConfig {
  /** Unique ID for this portal — matches folder name in /portals */
  portalId: string;

  /** Human-readable name */
  name: string;

  /** Short description shown in portal switcher */
  description?: string;

  /** Environment this config targets */
  environment: EnvironmentTag;

  /** Version string shown in footer / debug panel */
  version: string;

  /** Base route for this portal (all routes are relative to this) */
  basePath: RoutePattern;

  /** Portal layout shell mode */
  layout: LayoutMode;

  branding: BrandingConfig;
  theme: ThemeConfig;
  auth: AuthConfig;
  sidebar: SidebarConfig;
  header: HeaderConfig;
  tabBar: TabBarConfig;
  footer: FooterConfig;
  breadcrumbs: BreadcrumbConfig;
  toast: ToastConfig;
  errors: ErrorConfig;
  analytics: AnalyticsConfig;
  locale: LocaleConfig;
  features: FeatureFlags;
  portalSwitcher: PortalSwitcherConfig;
  widgets: WidgetRegistryEntry[];
  dashboard: DashboardLayoutConfig;
  api: ApiConfig;
  pageDefaults: PageDefaultsConfig;
}

// ─────────────────────────────────────────────
// 22. EXAMPLE: JANATICS SALES PORTAL
//     layout = "sidebar-header"
// ─────────────────────────────────────────────

export const janaticsPortalConfig: PortalConfig = {
  portalId: "janatics-sales",
  name: "Janatics Sales Portal",
  description: "OU Sales Performance & Green Channel Management",
  environment: "development",
  version: "1.0.0",
  basePath: "/sales",
  layout: "sidebar-header",

  branding: {
    appName: "Janatics",
    appTagline: "Precision in Motion",
    logoUrl: "/assets/logo.svg",
    logoDarkUrl: "/assets/logo-dark.svg",
    faviconUrl: "/assets/favicon.ico",
    logoWidth: 140,
    logoHeight: 36,
    showLogoText: true,
    logoCompactUrl: "/assets/logo-icon.svg",
  },

  theme: {
    colorScheme: "light",
    allowUserThemeToggle: true,
    persistTheme: true,
    primaryColor: "#0F5EAD",
    accentColor: "#F97316",
    dangerColor: "#DC2626",
    successColor: "#16A34A",
    warningColor: "#D97706",
    infoColor: "#0284C7",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    fontSize: "sm",
    borderRadius: "md",
    density: "comfortable",
    allowDensityToggle: true,
    sidebar: {
      background: "#0F172A",
      text: "#CBD5E1",
      activeBackground: "#1E3A5F",
      activeText: "#FFFFFF",
      hoverBackground: "#1E293B",
      border: "#1E293B",
    },
    header: {
      background: "#FFFFFF",
      text: "#1E293B",
      border: "#E2E8F0",
    },
  },

  auth: {
    strategy: "jwt",
    loginRoute: "/auth/login",
    logoutRoute: "/auth/logout",
    postLoginRedirect: "/sales/dashboard",
    postLogoutRedirect: "/auth/login",
    requireAuth: true,
    tokenKey: "janatics_access_token",
    refreshTokenKey: "janatics_refresh_token",
    refreshBufferMs: 60000,
    sessionWarningMs: 120000,
    allowedRoles: ["ADMIN", "SALES_MANAGER", "OU_HEAD", "VIEWER"],
    unauthorizedRoute: "/auth/unauthorized",
    notFoundRoute: "/404",
  },

  sidebar: {
    enabled: true,
    width: 260,
    collapsedWidth: 64,
    defaultState: "expanded",
    collapsible: true,
    persistState: true,
    persistKey: "janatics_sidebar_state",
    position: "left",
    showBranding: true,
    fixed: true,
    showTooltipsWhenCollapsed: true,
    showCollapseToggle: true,
    showUserFooter: true,
    autoCollapseOnMobile: true,
    mobileBreakpoint: 768,
    overlayOnMobile: true,
    activeItemStyle: "left-border",
    childIndent: 16,
    showChildIcons: true,
    accordionMode: true,
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: "LayoutDashboard",
        route: "/sales/dashboard",
        tooltip: "Dashboard",
      },
      {
        key: "performance",
        label: "OU Performance",
        icon: "TrendingUp",
        groupLabel: "Sales",
        children: [
          {
            key: "ou-summary",
            label: "OU Summary",
            icon: "BarChart2",
            route: "/sales/performance/ou-summary",
          },
          {
            key: "target-vs-actual",
            label: "Target vs Actual",
            icon: "Target",
            route: "/sales/performance/target-vs-actual",
          },
          {
            key: "monthly-trend",
            label: "Monthly Trend",
            icon: "LineChart",
            route: "/sales/performance/monthly-trend",
          },
        ],
      },
      {
        key: "green-channel",
        label: "Green Channel",
        icon: "CheckCircle",
        badge: { label: "New", variant: "text", color: "success" },
        children: [
          {
            key: "vendor-cert",
            label: "Vendor Self-Certification",
            route: "/sales/green-channel/vendor-cert",
          },
          {
            key: "approvals",
            label: "Approvals",
            route: "/sales/green-channel/approvals",
            badge: { label: "3", variant: "count", color: "warning" },
          },
        ],
      },
      {
        key: "reports",
        label: "Reports",
        icon: "FileText",
        groupLabel: "Analytics",
        route: "/sales/reports",
      },
      {
        key: "settings",
        label: "Settings",
        icon: "Settings",
        groupLabel: "System",
        permissions: ["ADMIN"],
        route: "/sales/settings",
      },
    ],
  },

  header: {
    enabled: true,
    height: 60,
    fixed: true,
    showLogo: false,
    showPortalName: true,
    showBreadcrumbs: true,
    showEnvironmentBadge: true,
    showHelpButton: true,
    helpUrl: "https://docs.janatics.internal/portal",
    showSearch: {
      show: true,
      placeholder: "Search portal… (Ctrl+K)",
      scope: "local",
      shortcut: "Ctrl+K",
      expandOnFocus: true,
      maxResults: 10,
      debounceMs: 300,
    },
    showNotifications: {
      show: true,
      icon: "Bell",
      pollIntervalMs: 30000,
      maxVisible: 5,
      showMarkAllRead: true,
      soundEnabled: false,
      groupByType: true,
    },
    userMenu: {
      show: true,
      showAvatar: true,
      showName: true,
      showEmail: false,
      showRole: true,
      avatarFallback: "initials",
      items: [
        { key: "profile", label: "My Profile", icon: "User", route: "/sales/profile" },
        { key: "preferences", label: "Preferences", icon: "SlidersHorizontal", route: "/sales/preferences" },
        { key: "divider1", label: "", dividerBefore: true },
        { key: "logout", label: "Sign Out", icon: "LogOut", onClick: "LOGOUT", danger: true },
      ],
    },
    actionButtons: [
      { key: "theme-toggle", icon: "Moon", label: "Toggle theme", onClick: "TOGGLE_THEME" },
      { key: "fullscreen", icon: "Maximize2", label: "Fullscreen", onClick: "TOGGLE_FULLSCREEN" },
    ],
  },

  tabBar: {
    enabled: false, // not used in sidebar-header layout
    position: "below-header",
    scrollable: true,
    showIcons: true,
    activeStyle: "underline",
    showOverflowMenu: true,
    animateIndicator: true,
    items: [],
  },

  footer: {
    enabled: true,
    fixed: false,
    height: 44,
    showCopyright: true,
    copyrightText: "© 2025 Janatics India Pvt. Ltd. All rights reserved.",
    showVersion: true,
    showLinks: true,
    links: [
      { label: "Privacy Policy", url: "/privacy" },
      { label: "Support", url: "https://helpdesk.janatics.internal", external: true },
    ],
    showEnvironmentInfo: true,
  },

  breadcrumbs: {
    enabled: true,
    separator: "/",
    showHome: true,
    homeIcon: "Home",
    homeLabel: "Home",
    maxItems: 4,
    showCurrentPage: true,
  },

  toast: {
    enabled: true,
    position: "top-right",
    duration: 4000,
    maxVisible: 5,
    showProgress: true,
    pauseOnHover: true,
    closeOnClick: false,
  },

  errors: {
    showStackInDev: true,
    reportErrors: false,
    fallbackRoute: "/sales/error",
  },

  analytics: {
    enabled: false,
    provider: "none",
    trackPageViews: false,
    trackClicks: false,
    trackErrors: true,
    anonymizeIp: true,
  },

  locale: {
    defaultLocale: "en",
    supportedLocales: ["en", "ta"],
    allowUserLocaleToggle: false,
    persistLocale: true,
    dateFormat: "DD/MM/YYYY",
    timeFormat: "12h",
    currency: "INR",
    numberLocale: "en-IN",
  },

  features: {
    enableDarkMode: true,
    enableGlobalSearch: true,
    enableNotifications: true,
    enableBreadcrumbs: true,
    enableAnalytics: false,
    enableHelpDesk: true,
    enablePortalSwitcher: true,
    enableMultiLanguage: false,
    enableAuditLog: true,
    enablePrintMode: true,
  },

  portalSwitcher: {
    enabled: true,
    position: "sidebar-header",
    style: "dropdown",
    showDescriptions: true,
    showIcons: true,
    portals: [
      {
        portalId: "janatics-sales",
        label: "Sales",
        description: "OU Performance & Channels",
        icon: "TrendingUp",
        route: "/sales/dashboard",
      },
      {
        portalId: "janatics-manufacturing",
        label: "Manufacturing",
        description: "R&D Budget & Production",
        icon: "Factory",
        route: "/manufacturing/dashboard",
        permissions: ["MFG_VIEW"],
      },
      {
        portalId: "janatics-hr",
        label: "HR",
        description: "People & Attendance",
        icon: "Users",
        route: "/hr/dashboard",
        permissions: ["HR_VIEW"],
      },
    ],
  },

  widgets: [
    {
      key: "ou-performance-chart",
      label: "OU Performance Chart",
      componentPath: "@/widgets/OuPerformanceChart",
      defaultColSpan: 8,
      defaultRowSpan: 4,
    },
    {
      key: "target-gauge",
      label: "Target Gauge",
      componentPath: "@/widgets/TargetGauge",
      defaultColSpan: 4,
      defaultRowSpan: 2,
    },
    {
      key: "recent-approvals",
      label: "Recent Approvals",
      componentPath: "@/widgets/RecentApprovals",
      defaultColSpan: 4,
      defaultRowSpan: 4,
      permissions: ["APPROVALS_VIEW"],
    },
  ],

  dashboard: {
    columns: 12,
    rowHeight: 80,
    gap: 16,
    allowUserCustomization: false,
    persistLayout: false,
    defaultWidgets: [
      { widgetKey: "ou-performance-chart", colStart: 1, rowStart: 1, colSpan: 8, rowSpan: 4 },
      { widgetKey: "target-gauge", colStart: 9, rowStart: 1, colSpan: 4, rowSpan: 2 },
      { widgetKey: "recent-approvals", colStart: 9, rowStart: 3, colSpan: 4, rowSpan: 4 },
    ],
  },

  api: {
    baseUrl: import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:5000/api",
    timeout: 30000,
    retryAttempts: 2,
    retryDelayMs: 1000,
    withCredentials: false,
    defaultHeaders: { "X-Portal-Id": "janatics-sales" },
    healthCheckUrl: "/health",
  },

  pageDefaults: {
    titleSuffix: "Janatics Portal",
    showPageSkeleton: true,
    transition: "fade",
    showPageHeader: true,
    showBackButton: true,
    contentPadding: "md",
    maxContentWidth: 1440,
    scrollRestore: true,
  },
};

// ─────────────────────────────────────────────
// 23. EXAMPLE: HEADER-TABS LAYOUT
//     (SaaS / Analytics portal variant)
// ─────────────────────────────────────────────

export const analyticsPortalConfig: Partial<PortalConfig> = {
  portalId: "janatics-analytics",
  name: "Analytics Portal",
  layout: "header-tabs",

  sidebar: {
    enabled: false,
    width: 0,
    collapsedWidth: 0,
    defaultState: "hidden",
    collapsible: false,
    persistState: false,
    position: "left",
    showBranding: false,
    fixed: false,
    showTooltipsWhenCollapsed: false,
    showCollapseToggle: false,
    showUserFooter: false,
    autoCollapseOnMobile: false,
    mobileBreakpoint: 768,
    overlayOnMobile: false,
    activeItemStyle: "left-border",
    childIndent: 16,
    showChildIcons: false,
    accordionMode: false,
    items: [],
  },

  tabBar: {
    enabled: true,
    position: "inside-header",
    scrollable: true,
    showIcons: true,
    activeStyle: "underline",
    showOverflowMenu: true,
    animateIndicator: true,
    items: [
      {
        key: "overview",
        label: "Overview",
        icon: "LayoutDashboard",
        route: "/analytics/overview",
      },
      {
        key: "sales",
        label: "Sales",
        icon: "TrendingUp",
        children: [
          { key: "by-ou", label: "By Operating Unit", route: "/analytics/sales/by-ou" },
          { key: "by-product", label: "By Product", route: "/analytics/sales/by-product" },
          { key: "by-region", label: "By Region", route: "/analytics/sales/by-region" },
        ],
      },
      {
        key: "operations",
        label: "Operations",
        icon: "Settings2",
        megaMenu: {
          enabled: true,
          columns: [
            {
              heading: "Production",
              items: [
                { key: "production-output", label: "Output", route: "/analytics/ops/output" },
                { key: "oee", label: "OEE Metrics", route: "/analytics/ops/oee" },
              ],
            },
            {
              heading: "Quality",
              items: [
                { key: "defect-rate", label: "Defect Rate", route: "/analytics/ops/defects" },
                { key: "rejections", label: "Rejections", route: "/analytics/ops/rejections" },
              ],
            },
          ],
        },
      },
      {
        key: "reports",
        label: "Reports",
        icon: "FileBarChart",
        route: "/analytics/reports",
        pinned: true,
      },
    ],
  },
};

export default janaticsPortalConfig;
