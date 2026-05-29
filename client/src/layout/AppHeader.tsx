import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, LogOut, User } from "lucide-react";
// 1. Import shadcn Sheet components for notifications
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
// 2. Import shadcn DropdownMenu components for the profile options
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Logo from "@/lib/constants";

const useUserSession = () => {
    return {
        name: "John Doe",
        email: "john.doe@janatics.com",
    };
};

export function AppHeader() {
    const { name, email } = useUserSession();

    // Handler logic placeholder for logouts
    const handleLogout = () => {
        console.log("Logging out...");
    };

    return (
        <header className="flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9" />

                <div className="h-5 w-px bg-border" />

                <div className="flex items-center gap-3">
                    <div className="flex h-9 items-center justify-center rounded bg-primary/5 px-2">
                        <img
                            src={Logo}
                            alt="JANATICS"
                            className="h-6 w-auto object-contain object-left"
                        />
                    </div>

                    <div className="h-4 w-px bg-border/60 hidden sm:block" />

                    <span className="text-xs font-medium text-muted-foreground hidden sm:inline-block">
                        Enterprise Resource Automation Panel
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4">

                {/* NOTIFICATION SHEET: Opens from the right */}
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
                            <Bell className="h-5 w-5" />
                            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-destructive" />
                        </Button>
                    </SheetTrigger>
                    {/* side="right" ensures it slides in from the right edge */}
                    <SheetContent side="right" className="w-100 sm:w-135">
                        <SheetHeader>
                            <SheetTitle>Notifications</SheetTitle>
                            <SheetDescription>
                                Stay updated with your enterprise automation logs.
                            </SheetDescription>
                        </SheetHeader>
                        {/* Feed Box: Put your live notification elements here */}
                        <div className="mt-6 flex flex-col items-center justify-center py-12 text-sm text-muted-foreground border border-dashed rounded-lg">
                            No new notifications at this time.
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="h-5 w-px bg-border" />

                {/* USER DROPDOWN MENU */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        {/* Button wrapper makes the entire layout block interactively hoverable and clickable */}
                        <Button variant="ghost" className="flex h-auto items-center gap-3 p-1 hover:bg-accent/50 rounded-lg transition-colors">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground border">
                                <User className="h-4 w-4" />
                            </div>

                            <div className="flex-col text-left hidden md:flex">
                                <span className="text-sm font-semibold leading-none text-foreground">
                                    {name}
                                </span>
                                <span className="mt-1 text-xs font-normal leading-none text-muted-foreground">
                                    {email}
                                </span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56 mt-1">
                        <DropdownMenuLabel className="font-normal md:hidden">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{name}</p>
                                <p className="text-xs leading-none text-muted-foreground">{email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="md:hidden" />

                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        <DropdownMenuItem className="cursor-pointer gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Profile Settings</span>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>
        </header>
    );
}

export default AppHeader;
