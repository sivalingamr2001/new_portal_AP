import loginApi from '@/api/loginApi'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { useLoader } from '@/hooks/useLoader'
import { useNavigate } from 'react-router-dom'
import { Loader } from '@/components/Loader'

export const LoginPage = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { withLoader, isLoading } = useLoader()

  const onSubmit = async () => {
    const values = {
      username: "admin",
      password: "admin",
    }

    const data = await withLoader(() => loginApi.login(values));

    login(data, 30);

    navigate("/home-page", {
      replace: true,
    })
  }
  return (
    <div>
      {isLoading && <Loader isText={true} />}
      <h1>Login</h1>
      <Button onClick={onSubmit}>Login</Button>
    </div>
  )
}
