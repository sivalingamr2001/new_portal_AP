import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import { ThemeProvider } from "@/context/theme-provider.tsx"
import App from "./App.tsx"
import { TooltipProvider } from "./components/ui/tooltip.tsx"
import { AuthProvider } from "./context/AuthContext.tsx"
import "./index.css"
import { SidebarProvider } from "./components/ui/sidebar.tsx"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <SidebarProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SidebarProvider>
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>
)
