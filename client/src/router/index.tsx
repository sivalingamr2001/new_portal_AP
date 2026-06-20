import { createBrowserRouter, RouterProvider } from "react-router-dom"
import { routesConfig } from "./routesConfig"

const router = createBrowserRouter(routesConfig, {
  basename: "/bin_portal",
})

export const Router = () => <RouterProvider router={router} />

export default Router
