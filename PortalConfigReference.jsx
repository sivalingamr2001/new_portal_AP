import { useState } from "react";

const SECTIONS = [
  {
    id: "layout",
    label: "Layout Modes",
    icon: "⬜",
    color: "#6366F1",
    items: [
      { name: "sidebar-header", desc: "Classic ERP — fixed sidebar + top header bar", tag: "ERP" },
      { name: "header-tabs", desc: "Sticky header with tab bar & dropdown child menus", tag: "SaaS" },
      { name: "sidebar-only", desc: "Sidebar only — no header (kiosk / embedded)", tag: "Kiosk" },
      { name: "header-only", desc: "Minimal header nav, no sidebar", tag: "Marketing" },
      { name: "fullscreen", desc: "No chrome — reports, presentations, embeds", tag: "Reports" },
    ],
  },
  {
    id: "sidebar",
    label: "SidebarConfig",
    icon: "▐",
    color: "#0F5EAD",
    fields: [
      { key: "enabled", type: "boolean", default: "true", desc: "Show/hide the sidebar" },
      { key: "width", type: "number", default: "260", desc: "Expanded width in px" },
      { key: "collapsedWidth", type: "number", default: "64", desc: "Icon-rail width in px" },
      { key: "defaultState", type: "'expanded' | 'collapsed' | 'hidden'", default: "'expanded'", desc: "State on page load" },
      { key: "collapsible", type: "boolean", default: "true", desc: "Allow user toggle" },
      { key: "persistState", type: "boolean", default: "true", desc: "Save state in localStorage" },
      { key: "persistKey", type: "string", default: "—", desc: "localStorage key" },
      { key: "position", type: "'left' | 'right'", default: "'left'", desc: "Sidebar side" },
      { key: "showBranding", type: "boolean", default: "true", desc: "Logo area inside sidebar" },
      { key: "fixed", type: "boolean", default: "true", desc: "Fixed vs scrollable" },
      { key: "showTooltipsWhenCollapsed", type: "boolean", default: "true", desc: "Label tooltips on icon rail" },
      { key: "showCollapseToggle", type: "boolean", default: "true", desc: "Toggle button at sidebar bottom" },
      { key: "showUserFooter", type: "boolean", default: "true", desc: "User avatar/name at bottom" },
      { key: "autoCollapseOnMobile", type: "boolean", default: "true", desc: "Collapse below mobileBreakpoint" },
      { key: "mobileBreakpoint", type: "number", default: "768", desc: "px below which it collapses" },
      { key: "overlayOnMobile", type: "boolean", default: "true", desc: "Overlay vs push on mobile" },
      { key: "activeItemStyle", type: "'filled' | 'left-border' | 'pill' | 'underline'", default: "'left-border'", desc: "Active item highlight" },
      { key: "childIndent", type: "number", default: "16", desc: "Nested item indent in px" },
      { key: "showChildIcons", type: "boolean", default: "true", desc: "Icons on nested items" },
      { key: "accordionMode", type: "boolean", default: "true", desc: "Collapse others on open" },
      { key: "items", type: "SidebarItem[]", default: "[]", desc: "Navigation items array" },
    ],
  },
  {
    id: "sidebaritem",
    label: "SidebarItem",
    icon: "≡",
    color: "#0369A1",
    fields: [
      { key: "key", type: "string", default: "—", desc: "Unique identifier" },
      { key: "label", type: "string", default: "—", desc: "Display text" },
      { key: "icon", type: "IconName", default: "—", desc: "Lucide icon name" },
      { key: "route", type: "RoutePattern", default: "—", desc: "Optional — omit for group headers" },
      { key: "permissions", type: "PermissionKey[]", default: "—", desc: "Guards for this item" },
      { key: "hidden", type: "boolean", default: "false", desc: "Hide without removing" },
      { key: "badge", type: "SidebarItemBadge", default: "—", desc: "Count / dot / text badge" },
      { key: "children", type: "SidebarChildItem[]", default: "—", desc: "Sub-navigation items" },
      { key: "groupLabel", type: "string", default: "—", desc: "Section divider label above" },
      { key: "disabled", type: "boolean", default: "false", desc: "Greyed out, non-clickable" },
      { key: "tooltip", type: "string", default: "—", desc: "Tooltip on collapsed rail" },
      { key: "flyoutOnCollapse", type: "boolean", default: "false", desc: "Children in flyout popover" },
    ],
  },
  {
    id: "header",
    label: "HeaderConfig",
    icon: "▬",
    color: "#7C3AED",
    fields: [
      { key: "enabled", type: "boolean", default: "true", desc: "Show/hide the header" },
      { key: "height", type: "number", default: "60", desc: "Header height in px" },
      { key: "fixed", type: "boolean", default: "true", desc: "Sticky top header" },
      { key: "showLogo", type: "boolean", default: "false", desc: "Logo in header (vs sidebar)" },
      { key: "showPortalName", type: "boolean", default: "true", desc: "Portal name text in header" },
      { key: "showBreadcrumbs", type: "boolean", default: "true", desc: "Breadcrumb trail" },
      { key: "showEnvironmentBadge", type: "boolean", default: "true", desc: "DEV / STG pill badge" },
      { key: "showHelpButton", type: "boolean", default: "true", desc: "? button linking to docs" },
      { key: "helpUrl", type: "string", default: "—", desc: "Docs / help URL" },
      { key: "showSearch", type: "HeaderSearchConfig", default: "—", desc: "Search bar options" },
      { key: "showNotifications", type: "HeaderNotificationsConfig", default: "—", desc: "Notification bell options" },
      { key: "userMenu", type: "HeaderUserMenuConfig", default: "—", desc: "Avatar + dropdown menu" },
      { key: "actionButtons", type: "HeaderActionButton[]", default: "[]", desc: "Icon buttons right of search" },
    ],
  },
  {
    id: "tabbar",
    label: "TabBarConfig",
    icon: "⊟",
    color: "#0891B2",
    fields: [
      { key: "enabled", type: "boolean", default: "false", desc: "Only for header-tabs layout" },
      { key: "position", type: "'below-header' | 'inside-header'", default: "'below-header'", desc: "Tab bar position" },
      { key: "scrollable", type: "boolean", default: "true", desc: "Horizontal scroll when overflow" },
      { key: "showIcons", type: "boolean", default: "true", desc: "Icons on tab labels" },
      { key: "activeStyle", type: "'underline' | 'filled' | 'border-bottom' | 'text-bold'", default: "'underline'", desc: "Active tab style" },
      { key: "showOverflowMenu", type: "boolean", default: "true", desc: "'More ▾' overflow dropdown" },
      { key: "animateIndicator", type: "boolean", default: "true", desc: "Slide active indicator" },
      { key: "items", type: "TabItem[]", default: "[]", desc: "Tab navigation items" },
    ],
  },
  {
    id: "tabitem",
    label: "TabItem + MegaMenu",
    icon: "⊞",
    color: "#0E7490",
    fields: [
      { key: "key", type: "string", default: "—", desc: "Unique key" },
      { key: "label", type: "string", default: "—", desc: "Tab label" },
      { key: "icon", type: "IconName", default: "—", desc: "Optional tab icon" },
      { key: "route", type: "RoutePattern", default: "—", desc: "Direct route; omit if children" },
      { key: "children", type: "TabChildMenuItem[]", default: "—", desc: "Simple dropdown children" },
      { key: "megaMenu.enabled", type: "boolean", default: "false", desc: "Use mega-menu instead" },
      { key: "megaMenu.columns", type: "Array<{heading, items}[]>", default: "—", desc: "Columnar mega-menu groups" },
      { key: "pinned", type: "boolean", default: "false", desc: "Can't be reordered/closed" },
      { key: "exactMatch", type: "boolean", default: "false", desc: "Exact route for active state" },
      { key: "badge", type: "SidebarItemBadge", default: "—", desc: "Badge on tab" },
      { key: "permissions", type: "PermissionKey[]", default: "—", desc: "Permission guards" },
    ],
  },
  {
    id: "theme",
    label: "ThemeConfig",
    icon: "◑",
    color: "#DB2777",
    fields: [
      { key: "colorScheme", type: "'light' | 'dark' | 'system'", default: "'light'", desc: "Color scheme" },
      { key: "allowUserThemeToggle", type: "boolean", default: "true", desc: "User can switch theme" },
      { key: "persistTheme", type: "boolean", default: "true", desc: "Remember in localStorage" },
      { key: "primaryColor", type: "string (hex)", default: "'#0F5EAD'", desc: "Brand primary" },
      { key: "accentColor", type: "string (hex)", default: "'#F97316'", desc: "Accent / CTA color" },
      { key: "fontFamily", type: "string", default: "'Inter, sans-serif'", desc: "CSS font-family" },
      { key: "fontSize", type: "'xs' | 'sm' | 'md' | 'lg'", default: "'sm'", desc: "Base font size" },
      { key: "borderRadius", type: "'none' | 'sm' | 'md' | 'lg' | 'full'", default: "'md'", desc: "Global border radius" },
      { key: "density", type: "'compact' | 'comfortable' | 'spacious'", default: "'comfortable'", desc: "UI density" },
      { key: "allowDensityToggle", type: "boolean", default: "true", desc: "User can change density" },
      { key: "cssVariables", type: "Record<string, string>", default: "—", desc: "Raw CSS variable overrides" },
      { key: "sidebar.*", type: "{ bg, text, activeBg, ... }", default: "—", desc: "Sidebar color tokens" },
      { key: "header.*", type: "{ bg, text, border }", default: "—", desc: "Header color tokens" },
    ],
  },
  {
    id: "auth",
    label: "AuthConfig",
    icon: "🔒",
    color: "#B45309",
    fields: [
      { key: "strategy", type: "'jwt' | 'session' | 'oauth2' | 'saml' | 'none'", default: "'jwt'", desc: "Auth strategy" },
      { key: "loginRoute", type: "RoutePattern", default: "'/auth/login'", desc: "Login page route" },
      { key: "logoutRoute", type: "RoutePattern", default: "'/auth/logout'", desc: "Logout route" },
      { key: "postLoginRedirect", type: "RoutePattern", default: "—", desc: "After login redirect" },
      { key: "requireAuth", type: "boolean", default: "true", desc: "Guard all portal routes" },
      { key: "tokenKey", type: "string", default: "—", desc: "localStorage JWT key" },
      { key: "refreshTokenKey", type: "string", default: "—", desc: "Refresh token key" },
      { key: "refreshBufferMs", type: "number", default: "60000", desc: "Refresh before expiry (ms)" },
      { key: "sessionWarningMs", type: "number", default: "120000", desc: "Warning dialog timing (ms)" },
      { key: "allowedRoles", type: "string[]", default: "—", desc: "Roles with portal access" },
      { key: "unauthorizedRoute", type: "RoutePattern", default: "—", desc: "403 fallback route" },
      { key: "notFoundRoute", type: "RoutePattern", default: "'/404'", desc: "404 fallback route" },
    ],
  },
  {
    id: "features",
    label: "FeatureFlags",
    icon: "⚑",
    color: "#059669",
    fields: [
      { key: "enableDarkMode", type: "boolean", default: "true", desc: "Dark mode toggle in UI" },
      { key: "enableGlobalSearch", type: "boolean", default: "true", desc: "Cmd+K global search" },
      { key: "enableNotifications", type: "boolean", default: "true", desc: "Notification bell" },
      { key: "enableBreadcrumbs", type: "boolean", default: "true", desc: "Breadcrumb trail" },
      { key: "enableAnalytics", type: "boolean", default: "false", desc: "Page tracking" },
      { key: "enableHelpDesk", type: "boolean", default: "true", desc: "? help button" },
      { key: "enablePortalSwitcher", type: "boolean", default: "true", desc: "Multi-portal switcher" },
      { key: "enableMultiLanguage", type: "boolean", default: "false", desc: "i18n locale toggle" },
      { key: "enableAuditLog", type: "boolean", default: "true", desc: "Audit trail logging" },
      { key: "enablePrintMode", type: "boolean", default: "true", desc: "Print-friendly mode" },
      { key: "[custom]", type: "boolean", default: "—", desc: "Any custom feature flag" },
    ],
  },
  {
    id: "footer",
    label: "FooterConfig",
    icon: "▬",
    color: "#64748B",
    fields: [
      { key: "enabled", type: "boolean", default: "true", desc: "Show footer" },
      { key: "fixed", type: "boolean", default: "false", desc: "Sticky bottom footer" },
      { key: "height", type: "number", default: "44", desc: "Height in px" },
      { key: "showCopyright", type: "boolean", default: "true", desc: "Copyright text" },
      { key: "copyrightText", type: "string", default: "—", desc: "Custom copyright string" },
      { key: "showVersion", type: "boolean", default: "true", desc: "App version string" },
      { key: "showLinks", type: "boolean", default: "true", desc: "Footer link list" },
      { key: "links", type: "FooterLink[]", default: "[]", desc: "URL links in footer" },
      { key: "showEnvironmentInfo", type: "boolean", default: "true", desc: "DEV / STG env label" },
    ],
  },
  {
    id: "others",
    label: "Other Configs",
    icon: "⋯",
    color: "#475569",
    subsections: [
      {
        title: "BreadcrumbConfig",
        fields: ["enabled", "separator", "showHome", "homeIcon", "maxItems", "showCurrentPage"],
      },
      {
        title: "ToastConfig",
        fields: ["enabled", "position (9 options)", "duration", "maxVisible", "showProgress", "pauseOnHover", "closeOnClick"],
      },
      {
        title: "LocaleConfig",
        fields: ["defaultLocale", "supportedLocales", "allowUserLocaleToggle", "dateFormat", "timeFormat", "currency", "numberLocale"],
      },
      {
        title: "AnalyticsConfig",
        fields: ["enabled", "provider (gtm/ga4/mixpanel/custom)", "trackPageViews", "trackClicks", "trackErrors", "anonymizeIp"],
      },
      {
        title: "ApiConfig",
        fields: ["baseUrl", "timeout", "retryAttempts", "retryDelayMs", "withCredentials", "defaultHeaders", "healthCheckUrl"],
      },
      {
        title: "DashboardLayoutConfig",
        fields: ["columns (grid)", "rowHeight", "gap", "allowUserCustomization", "persistLayout", "defaultWidgets[]"],
      },
      {
        title: "PortalSwitcherConfig",
        fields: ["enabled", "position (4 options)", "style (dropdown/modal/drawer)", "showDescriptions", "portals[]"],
      },
      {
        title: "PageDefaultsConfig",
        fields: ["titleSuffix", "showPageSkeleton", "transition (4 types)", "showPageHeader", "contentPadding", "maxContentWidth", "scrollRestore"],
      },
    ],
  },
];

const LAYOUT_PREVIEWS = {
  "sidebar-header": {
    label: "sidebar-header",
    ascii: [
      ["header", "header", "header", "header"],
      ["sidebar", "content", "content", "content"],
      ["sidebar", "content", "content", "content"],
      ["sidebar", "content", "content", "content"],
    ],
    colors: { header: "#7C3AED", sidebar: "#0F5EAD", content: "#F1F5F9" },
    tag: "ERP / Enterprise",
  },
  "header-tabs": {
    label: "header-tabs",
    ascii: [
      ["header", "header", "header", "header"],
      ["tabs", "tabs", "tabs", "tabs"],
      ["content", "content", "content", "content"],
      ["content", "content", "content", "content"],
    ],
    colors: { header: "#7C3AED", tabs: "#0891B2", content: "#F1F5F9" },
    tag: "SaaS / Analytics",
  },
  "sidebar-only": {
    label: "sidebar-only",
    ascii: [
      ["sidebar", "content", "content", "content"],
      ["sidebar", "content", "content", "content"],
      ["sidebar", "content", "content", "content"],
      ["sidebar", "content", "content", "content"],
    ],
    colors: { sidebar: "#0F5EAD", content: "#F1F5F9" },
    tag: "Kiosk / Embedded",
  },
  "header-only": {
    label: "header-only",
    ascii: [
      ["header", "header", "header", "header"],
      ["content", "content", "content", "content"],
      ["content", "content", "content", "content"],
      ["content", "content", "content", "content"],
    ],
    colors: { header: "#7C3AED", content: "#F1F5F9" },
    tag: "Marketing / Public",
  },
  fullscreen: {
    label: "fullscreen",
    ascii: [
      ["content", "content", "content", "content"],
      ["content", "content", "content", "content"],
      ["content", "content", "content", "content"],
      ["content", "content", "content", "content"],
    ],
    colors: { content: "#F1F5F9" },
    tag: "Reports / Embeds",
  },
};

function TypePill({ type }) {
  const isComplex = type.includes("|") || type.includes("[]") || type.includes("{");
  return (
    <span style={{
      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      fontSize: "11px",
      background: isComplex ? "#EDE9FE" : "#F0FDF4",
      color: isComplex ? "#6D28D9" : "#15803D",
      padding: "1px 6px",
      borderRadius: "4px",
      whiteSpace: "pre",
    }}>
      {type}
    </span>
  );
}

function DefaultPill({ value }) {
  if (value === "—") return <span style={{ color: "#94A3B8", fontSize: "11px" }}>—</span>;
  return (
    <span style={{
      fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
      fontSize: "11px",
      background: "#FFF7ED",
      color: "#C2410C",
      padding: "1px 6px",
      borderRadius: "4px",
    }}>
      {value}
    </span>
  );
}

function LayoutGrid({ layout }) {
  const data = LAYOUT_PREVIEWS[layout];
  if (!data) return null;
  const { ascii, colors, tag } = data;
  const cellStyle = (cell) => ({
    background: colors[cell] || "#E2E8F0",
    color: "#fff",
    fontSize: "9px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderRadius: "2px",
    border: "1px solid rgba(255,255,255,0.15)",
  });
  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gridTemplateRows: "repeat(4, 20px)",
        gap: "2px",
        marginBottom: "6px",
        borderRadius: "6px",
        overflow: "hidden",
        border: "1px solid #E2E8F0",
      }}>
        {ascii.flat().map((cell, i) => (
          <div key={i} style={cellStyle(cell)}>{cell[0]}</div>
        ))}
      </div>
      <div style={{ fontSize: "10px", color: "#64748B", textAlign: "center" }}>{tag}</div>
    </div>
  );
}

function FieldTable({ fields }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
      <thead>
        <tr style={{ background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
          {["Field", "Type", "Default", "Description"].map(h => (
            <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#64748B", fontWeight: "600", fontSize: "11px", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {fields.map((f, i) => (
          <tr key={f.key} style={{ background: i % 2 === 0 ? "#FFFFFF" : "#F8FAFC", borderBottom: "1px solid #F1F5F9" }}>
            <td style={{ padding: "6px 10px", fontFamily: "'Fira Code', monospace", fontWeight: "600", color: "#1E293B", fontSize: "11px", whiteSpace: "nowrap" }}>
              {f.key}
            </td>
            <td style={{ padding: "6px 10px" }}><TypePill type={f.type} /></td>
            <td style={{ padding: "6px 10px" }}><DefaultPill value={f.default} /></td>
            <td style={{ padding: "6px 10px", color: "#475569", lineHeight: "1.4" }}>{f.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PortalConfigReference() {
  const [activeSection, setActiveSection] = useState("layout");
  const [selectedLayout, setSelectedLayout] = useState("sidebar-header");
  const [search, setSearch] = useState("");

  const section = SECTIONS.find(s => s.id === activeSection);

  const filteredFields = section?.fields?.filter(f =>
    !search || f.key.toLowerCase().includes(search.toLowerCase()) || f.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', system-ui, sans-serif", background: "#F8FAFC", overflow: "hidden" }}>
      {/* Sidebar Nav */}
      <div style={{
        width: "220px",
        minWidth: "220px",
        background: "#0F172A",
        color: "#CBD5E1",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}>
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #1E293B" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#64748B", textTransform: "uppercase", marginBottom: "4px" }}>Janatics</div>
          <div style={{ fontSize: "15px", fontWeight: "700", color: "#F1F5F9", lineHeight: "1.2" }}>portalConfig.ts</div>
          <div style={{ fontSize: "11px", color: "#475569", marginTop: "3px" }}>Full Reference</div>
        </div>
        <div style={{ padding: "10px 8px", flex: 1 }}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setSearch(""); }}
              style={{
                width: "100%",
                background: activeSection === s.id ? "#1E293B" : "transparent",
                border: "none",
                borderLeft: activeSection === s.id ? `3px solid ${s.color}` : "3px solid transparent",
                color: activeSection === s.id ? "#F1F5F9" : "#94A3B8",
                padding: "8px 10px",
                textAlign: "left",
                cursor: "pointer",
                borderRadius: "4px",
                marginBottom: "2px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "13px",
                fontWeight: activeSection === s.id ? "600" : "400",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "14px", minWidth: "16px", textAlign: "center" }}>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #1E293B", fontSize: "10px", color: "#334155" }}>
          23 config sections · 150+ options
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div style={{
          background: "#FFFFFF",
          borderBottom: "1px solid #E2E8F0",
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          minHeight: "60px",
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "8px",
            background: section?.color || "#64748B",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", color: "#fff",
          }}>
            {section?.icon}
          </div>
          <div>
            <div style={{ fontWeight: "700", fontSize: "16px", color: "#1E293B" }}>{section?.label}</div>
            <div style={{ fontSize: "12px", color: "#94A3B8" }}>
              {section?.fields ? `${section.fields.length} configurable fields` :
               section?.items ? `${section.items.length} layout modes` :
               section?.subsections ? `${section.subsections.length} sub-configurations` : ""}
            </div>
          </div>
          {section?.fields && (
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter fields…"
              style={{
                marginLeft: "auto",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                padding: "6px 12px",
                fontSize: "13px",
                outline: "none",
                width: "200px",
                color: "#1E293B",
              }}
            />
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* LAYOUT MODE SECTION */}
          {activeSection === "layout" && (
            <div>
              <p style={{ color: "#64748B", fontSize: "13px", marginBottom: "20px", lineHeight: "1.6" }}>
                Set <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: "3px", fontFamily: "monospace", fontSize: "12px" }}>layout</code> in your <code style={{ background: "#F1F5F9", padding: "1px 5px", borderRadius: "3px", fontFamily: "monospace", fontSize: "12px" }}>PortalConfig</code> to one of these five modes. Each mode enables/disables sidebar, header, and tabBar accordingly.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
                {SECTIONS[0].items.map(item => (
                  <div
                    key={item.name}
                    onClick={() => setSelectedLayout(item.name)}
                    style={{
                      background: "#FFFFFF",
                      border: `2px solid ${selectedLayout === item.name ? "#0F5EAD" : "#E2E8F0"}`,
                      borderRadius: "10px",
                      padding: "16px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                      boxShadow: selectedLayout === item.name ? "0 0 0 3px #DBEAFE" : "none",
                    }}
                  >
                    <LayoutGrid layout={item.name} />
                    <div style={{ marginTop: "10px" }}>
                      <code style={{ fontFamily: "'Fira Code', monospace", fontSize: "12px", fontWeight: "700", color: "#0F172A" }}>
                        "{item.name}"
                      </code>
                      <p style={{ fontSize: "11px", color: "#64748B", marginTop: "4px", lineHeight: "1.5" }}>{item.desc}</p>
                      <div style={{
                        marginTop: "8px",
                        display: "inline-block",
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        fontSize: "10px",
                        fontWeight: "600",
                        padding: "2px 8px",
                        borderRadius: "100px",
                      }}>{item.tag}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Layout matrix */}
              <div style={{ marginTop: "28px", background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F5F9", fontWeight: "700", fontSize: "13px", color: "#1E293B" }}>
                  Layout Mode → Config Behaviour Matrix
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC" }}>
                      {["Layout", "sidebar.enabled", "header.enabled", "tabBar.enabled", "Typical Use"].map(h => (
                        <th key={h} style={{ padding: "8px 14px", textAlign: "left", color: "#64748B", fontWeight: "600", fontSize: "11px", borderBottom: "1px solid #E2E8F0" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["sidebar-header", "✅ true", "✅ true", "❌ false", "ERP, CRM, Admin panels"],
                      ["header-tabs", "❌ false", "✅ true", "✅ true", "SaaS products, Analytics"],
                      ["sidebar-only", "✅ true", "❌ false", "❌ false", "Kiosk, Embedded apps"],
                      ["header-only", "❌ false", "✅ true", "❌ false", "Marketing, Public portals"],
                      ["fullscreen", "❌ false", "❌ false", "❌ false", "Reports, Presentations"],
                    ].map(([layout, ...rest], i) => (
                      <tr key={layout} style={{ background: i % 2 ? "#F8FAFC" : "#FFF", borderBottom: "1px solid #F1F5F9" }}>
                        <td style={{ padding: "8px 14px" }}>
                          <code style={{ fontFamily: "monospace", fontWeight: "700", fontSize: "12px", color: "#0F5EAD" }}>{layout}</code>
                        </td>
                        {rest.map((v, j) => (
                          <td key={j} style={{ padding: "8px 14px", color: v.startsWith("✅") ? "#16A34A" : v.startsWith("❌") ? "#DC2626" : "#475569", fontSize: "12px" }}>
                            {v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* FIELD TABLE SECTIONS */}
          {section?.fields && (
            <div style={{ background: "#FFFFFF", borderRadius: "10px", border: "1px solid #E2E8F0", overflow: "hidden" }}>
              <FieldTable fields={filteredFields || section.fields} />
              {filteredFields?.length === 0 && (
                <div style={{ padding: "24px", textAlign: "center", color: "#94A3B8", fontSize: "13px" }}>
                  No fields match "{search}"
                </div>
              )}
            </div>
          )}

          {/* OTHER SECTIONS */}
          {activeSection === "others" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {section.subsections.map(sub => (
                <div key={sub.title} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "16px" }}>
                  <div style={{ fontWeight: "700", fontSize: "13px", color: "#1E293B", marginBottom: "10px", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                    {sub.title}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {sub.fields.map(f => (
                      <span key={f} style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: "11px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        color: "#1E293B",
                        padding: "3px 8px",
                        borderRadius: "4px",
                      }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
