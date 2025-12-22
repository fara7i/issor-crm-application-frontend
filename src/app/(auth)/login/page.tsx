"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth.store";
import { UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Package,
  Mail,
  Lock,
  Loader2,
  Shield,
  ShieldCheck,
  Store,
  Warehouse,
  CheckCircle2,
} from "lucide-react";

const roleConfig: Record<
  UserRole,
  {
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    email: string;
    redirect: string;
  }
> = {
  SUPER_ADMIN: {
    title: "Super Admin",
    description: "Full access to all features",
    icon: ShieldCheck,
    email: "superadmin@magazine.ma",
    redirect: "/super-admin/dashboard",
  },
  ADMIN: {
    title: "Admin",
    description: "Manage products, stock & finances",
    icon: Shield,
    email: "admin@magazine.ma",
    redirect: "/admin/dashboard",
  },
  SHOP_AGENT: {
    title: "Shop Agent",
    description: "Handle orders & sales",
    icon: Store,
    email: "shop@magazine.ma",
    redirect: "/shop-agent/orders",
  },
  WAREHOUSE_AGENT: {
    title: "Warehouse Agent",
    description: "Scan & manage inventory",
    icon: Warehouse,
    email: "warehouse@magazine.ma",
    redirect: "/warehouse-agent/scan-orders",
  },
  CONFIRMER: {
    title: "Confirmer",
    description: "Confirm orders",
    icon: CheckCircle2,
    email: "confirmer@magazine.ma",
    redirect: "/confirmer",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithRole, isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.push("/super-admin/dashboard");
    }
  }, [mounted, isAuthenticated, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    const success = await login(email, password);
    if (success) {
      toast.success("Login successful!");
      // Get the user role and redirect
      const user = useAuthStore.getState().user;
      if (user) {
        router.push(roleConfig[user.role].redirect);
      }
    } else {
      toast.error("Invalid credentials. Try using one of the demo accounts.");
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    loginWithRole(role);
    toast.success(`Logged in as ${roleConfig[role].title}`);
    router.push(roleConfig[role].redirect);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Sign in to manage your inventory
          </p>
        </div>

        <Card className="shadow-lg">
          <Tabs defaultValue="demo" className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="demo">Quick Demo</TabsTrigger>
                <TabsTrigger value="email">Email Login</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="demo" className="mt-0 space-y-4">
                <CardDescription className="text-center">
                  Select a role to explore the system
                </CardDescription>
                <div className="grid gap-3">
                  {(Object.keys(roleConfig) as UserRole[]).map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    return (
                      <Button
                        key={role}
                        variant="outline"
                        className="h-auto py-4 px-4 justify-start hover:bg-primary/5 hover:border-primary"
                        onClick={() => handleQuickLogin(role)}
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{config.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {config.description}
                            </p>
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="email" className="mt-0">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground text-center mb-2">
                    Demo accounts (any password):
                  </p>
                  <div className="text-xs space-y-1">
                    {(Object.keys(roleConfig) as UserRole[]).map((role) => (
                      <div key={role} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {roleConfig[role].title}:
                        </span>
                        <button
                          type="button"
                          className="font-mono text-primary hover:underline"
                          onClick={() => setEmail(roleConfig[role].email)}
                        >
                          {roleConfig[role].email}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>

          <CardFooter className="flex flex-col gap-2 text-center text-xs text-muted-foreground border-t pt-4">
            <p>This is a demo application with mock data.</p>
            <p>No real authentication is performed.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
