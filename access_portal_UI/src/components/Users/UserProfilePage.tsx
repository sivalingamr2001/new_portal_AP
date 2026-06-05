import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"
import { getInitials } from "@/lib/constants"
import { Building2, Mail, MapPin, Phone } from "lucide-react"

export const UserProfilePage = () => {
  const { currentUser } = useAuth()

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div>
        {/* Profile Card Container */}
        <div className="overflow-hidden rounded-[24px] border border-border bg-card text-card-foreground shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Header Gradient Banner */}
          <div className="h-37.5 bg-gradient-to-r from-primary to-accent"></div>

          {/* Core Profile Content */}
          <div className="px-10 pb-10">
            {/* Avatar & Title Section */}
            <div className="-mt-14 mb-8 flex items-end gap-5">
              <Avatar className="h-27.5 w-27.5 border-4 border-card shadow-md">
                <AvatarImage
                  src="/avatars/01.png"
                  alt={currentUser?.cmplUser?.cmplUserName}
                />
                <AvatarFallback className="bg-primary text-xl font-medium tracking-wide text-primary-foreground">
                  {getInitials(
                    currentUser?.cmplUser?.cmplUserName || "Demo User"
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="mb-8">
                <h1 className="text-[28px] leading-tight font-normal tracking-tight text-card-foreground">
                  {currentUser?.cmplUser?.cmplUserName || "Demo User"}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground capitalize">
                  {currentUser?.user?.role || "User"}
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="mb-6 grid grid-cols-3 border-b border-border pb-6 text-center">
              <div>
                <p className="text-[22px] font-normal text-primary">
                  {currentUser?.user?.userId || "6"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  User ID
                </p>
              </div>
              <div>
                <p className="text-[22px] font-normal text-primary">
                  {currentUser?.cmplUser?.empId || "E004"}
                </p>
                <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                  Employee ID
                </p>
              </div>
              <div>
                <p className="text-[22px] font-normal text-primary">&nbsp;</p>
                <p className="mt-1 text-[11px] font-medium text-slate-400">
                  Team Size
                </p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-4 text-card-foreground">
                <Mail className="h-4.5 w-4.5 text-primary" />
                <span className="text-[14px]">
                  {currentUser?.cmplUser?.mailId || "e004@demo.com"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-card-foreground">
                <Phone className="h-4.5 w-4.5 text-primary" />
                <span className="text-[14px]">
                  {currentUser?.cmplUser?.mobNo || "0000000000"}
                </span>
              </div>
              <div className="flex items-center gap-4 text-card-foreground">
                <MapPin className="h-4.5 w-4.5 text-primary" />
                <span className="text-[14px]">
                  {currentUser?.user?.location || "Default"}
                </span>
              </div>
            </div>

            {/* Hierarchy & Structure */}
            <div className="space-y-4">
              <h2 className="text-[12px] font-bold tracking-wider text-muted-foreground uppercase">
                Organization
              </h2>

              {/* Department Block */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary p-5">
                <div>
                  <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                    Department
                  </p>
                  <p className="mt-0.5 text-[15px] font-bold text-card-foreground">
                    {currentUser?.department?.deptName || "IT"}
                  </p>
                </div>
                <Building2 className="h-5 w-5 text-primary opacity-70" />
              </div>

              {/* Head of Department Block */}
              <div className="rounded-xl border border-border bg-secondary p-5 opacity-95">
                <p className="mb-3 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                  Head of Department
                </p>
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src="/avatars/02.png"
                      alt={currentUser?.hod?.hodName}
                    />
                    <AvatarFallback className="bg-chart-1 text-xs font-bold text-primary-foreground">
                      {getInitials(currentUser?.hod?.hodName || "SIVALINGAM R")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[14px] font-bold tracking-wide text-card-foreground uppercase">
                      {currentUser?.hod?.hodName || "SIVALINGAM R"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
