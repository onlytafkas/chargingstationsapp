import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Zap, BarChart3, MapPin, Activity } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950 font-sans">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-white">
            Dashboard
          </h1>
          <p className="text-lg text-zinc-400">
            Monitor and manage your charging stations
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Zap className="h-4 w-4" />
              Active Stations
            </div>
            <div className="text-3xl font-bold text-white">24</div>
            <p className="mt-1 text-sm text-emerald-400">+2 from last week</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Activity className="h-4 w-4" />
              Active Sessions
            </div>
            <div className="text-3xl font-bold text-white">12</div>
            <p className="mt-1 text-sm text-blue-400">8 charging now</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-400">
              <MapPin className="h-4 w-4" />
              Locations
            </div>
            <div className="text-3xl font-bold text-white">6</div>
            <p className="mt-1 text-sm text-zinc-500">Across 3 cities</p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-400">
              <BarChart3 className="h-4 w-4" />
              Energy Today
            </div>
            <div className="text-3xl font-bold text-white">847 kWh</div>
            <p className="mt-1 text-sm text-emerald-400">+15% vs yesterday</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur">
          <h2 className="mb-4 text-2xl font-semibold text-white">
            Recent Activity
          </h2>
          <p className="text-zinc-400">
            Your charging station activity will appear here. Connect your first station to get started.
          </p>
          <Button className="mt-6 gap-2 bg-emerald-600 hover:bg-emerald-500">
            <Zap className="h-4 w-4" />
            Connect Station
          </Button>
        </div>
      </div>
    </div>
  );
}
