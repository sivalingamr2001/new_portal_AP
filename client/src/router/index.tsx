import { Loader } from "@/components/Loader";
import AppLayout from "@/layout/AppLayout";
import { AuthLayout } from "@/layout/AuthLayout";
import ErrorBountry from "@/pages/ErrorBountry";
import { ProtectedRoute } from "@/pages/ProtectedRoute";
import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const HomePage = lazy(() => import("@/pages/HomePage").then((m) => ({ default: m.HomePage })));

const withSuspense = (Component: React.ComponentType) => (
    <Suspense fallback={<Loader />}>
        <Component />
    </Suspense>
);

const router = createBrowserRouter(
    [
        {
            element: <ProtectedRoute />,
            errorElement: <ErrorBountry />,
            children: [
                {
                    element: <AppLayout />,
                    errorElement: <ErrorBountry />,
                    children: [
                        { index: true, element: <Navigate to='/home-page' replace /> },
                        { path: "/home-page", element: withSuspense(HomePage) }
                    ]
                }
            ]
        },
        {
            element: <AuthLayout />,
            children: [
                { index: true, element: <Navigate to='/login' replace /> },
                { path: "/login", element: withSuspense(LoginPage) }
            ]
        }
    ],
    { basename: '/access-portal' }
)


export const Router = () => <RouterProvider router={router} />;