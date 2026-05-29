import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <div>AppSideBar</div>
      <div>
        <div>AppHeader</div>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
