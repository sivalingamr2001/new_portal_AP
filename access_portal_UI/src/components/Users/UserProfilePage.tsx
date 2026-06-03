import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/constants'
import { Building2, Mail, MapPin, Phone } from 'lucide-react'

export const UserProfilePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div>
        {/* Profile Card Container */}
        <div className="bg-card text-card-foreground rounded-[24px] border border-border shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          
          {/* Header Gradient Banner */}
          <div className="h-37.5 bg-gradient-to-r from-primary to-accent"></div>

          {/* Core Profile Content */}
          <div className="px-10 pb-10">
            
            {/* Avatar & Title Section */}
            <div className="flex items-end gap-5 -mt-14 mb-8">
              <Avatar className="h-27.5 w-27.5 border-4 border-card shadow-md">
                <AvatarImage src="/avatars/01.png" alt={currentUser?.cmplUser?.cmplUserName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-medium tracking-wide">
                  {getInitials(currentUser?.cmplUser?.cmplUserName || 'Demo User')}
                </AvatarFallback>
              </Avatar>
              <div className="mb-8">
                <h1 className="text-[28px] font-normal text-card-foreground tracking-tight leading-tight">
                  {currentUser?.cmplUser?.cmplUserName || 'Demo User'}
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5 capitalize">
                  {currentUser?.user?.role || 'User'}
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 text-center border-b border-border pb-6 mb-6">
              <div>
                <p className="text-[22px] font-normal text-primary">{currentUser?.user?.userId || '6'}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">User ID</p>
              </div>
              <div>
                <p className="text-[22px] font-normal text-primary">{currentUser?.cmplUser?.empId || 'E004'}</p>
                <p className="text-[11px] text-muted-foreground font-medium mt-1">Employee ID</p>
              </div>
              <div>
                <p className="text-[22px] font-normal text-primary">&nbsp;</p> 
                <p className="text-[11px] text-slate-400 font-medium mt-1">Team Size</p>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 text-card-foreground">
                <Mail className="h-4.5 w-4.5 text-primary" />
                <span className="text-[14px]">{currentUser?.cmplUser?.mailId || 'e004@demo.com'}</span>
              </div>
              <div className="flex items-center gap-4 text-card-foreground">
                <Phone className="h-4.5 w-4.5 text-primary" />
                <span className="text-[14px]">{currentUser?.cmplUser?.mobNo || '0000000000'}</span>
              </div>
              <div className="flex items-center gap-4 text-card-foreground">
                <MapPin className="h-4.5 w-4.5 text-primary" />
                <span className="text-[14px]">{currentUser?.user?.location || 'Default'}</span>
              </div>
            </div>

            {/* Hierarchy & Structure */}
            <div className="space-y-4">
              <h2 className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                Organization
              </h2>
              
              {/* Department Block */}
              <div className="rounded-xl bg-secondary p-5 border border-border flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Department</p>
                  <p className="font-bold text-card-foreground text-[15px] mt-0.5">{currentUser?.department?.deptName || 'IT'}</p>
                </div>
                <Building2 className="h-5 w-5 text-primary opacity-70" />
              </div>

              {/* Head of Department Block */}
              <div className="rounded-xl bg-secondary p-5 border border-border opacity-95">
                <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mb-3">
                  Head of Department
                </p>
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="/avatars/02.png" alt={currentUser?.hod?.hodName} />
                    <AvatarFallback className="bg-chart-1 text-primary-foreground text-xs font-bold">
                      {getInitials(currentUser?.hod?.hodName || 'SIVALINGAM R')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-card-foreground text-[14px] uppercase tracking-wide">
                      {currentUser?.hod?.hodName || 'SIVALINGAM R'}
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
