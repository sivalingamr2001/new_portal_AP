import React, { useState } from "react"
import { loginApi } from "@/api/loginApi"
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

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { withLoader, loading } = useLoader()

  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const values = {
        identifier,
        password,
      }

      // TypeScript now infers 'data' as LoginResponse
      const data = await withLoader(() => loginApi.login(values))

      if (data && data.isSuccess) {

        login(data.value, 30)

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
                <FieldLabel htmlFor="identifier">Username or Email</FieldLabel>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="Username/Email"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
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
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
