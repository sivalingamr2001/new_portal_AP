import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { useLoader } from "@/hooks/useLoader"
import { useNavigate } from "react-router-dom"
import Logo from "@/lib/constants"
import { Loader } from "@/components/Loader"
import { loginApi } from "@/api/authApi"

export const LoginPage = () => {
  const { login, bypassLogin } = useAuth()
  const navigate = useNavigate()
  const { withLoader, loading } = useLoader()

  const [username, setUsername] = useState("CBE25225")
  const [password, setPassword] = useState("cbe2janatics")

  const handleBypassLogin = (role: "hod" | "user") => {
    bypassLogin(role)
    navigate("/", { replace: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const data = await withLoader(() => loginApi(username, password))

      if (data) {
        login(username, data.region, data.subRegion, 30)
        navigate("/", {
          replace: true,
        })
      }
    } catch (error) {
      console.error("Login failed:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4 md:p-8">
        <div className="w-full max-w-sm md:max-w-md">
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <div className="bg-muted p-4">
            <img src={Logo} alt="JANATICS" />
          </div>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username or Email</FieldLabel>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username/Email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </Field>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleBypassLogin("hod")}
                  disabled={loading}
                  className="flex-1"
                >
                  HOD Bypass
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleBypassLogin("user")}
                  disabled={loading}
                  className="flex-1"
                >
                  User Bypass
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
