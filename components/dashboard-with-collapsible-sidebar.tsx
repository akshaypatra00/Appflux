"use client"
import React from "react";
import Image from "next/image";
import {
  DollarSign,
  Activity,
  TrendingUp,
  Package,
  Bell,
  Eye,
  Download,
  LayoutGrid,
  Upload,
  Flame,
  CheckCircle,
  XCircle,
  Loader2,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AnalyticsCard } from "@/components/card";
import { NotificationPanel } from "@/components/NotificationPanel";
import { createClient } from "@/lib/supabase/client";

interface DashboardContentProps {
  user?: any;
  stats: {
    totalApps: number;
    totalViews: number;
    totalDownloads: number;
    streak?: number;
  };
  recentActivity: any[];
  dailyActivity?: { label: string; value: number; displayValue?: number; highlight?: boolean }[];
  topApps?: any[];
  deployments?: any[];
}

export default function DashboardContent({ user, stats, recentActivity, dailyActivity, topApps, deployments }: DashboardContentProps) {
  const [isNotificationOpen, setIsNotificationOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const supabase = createClient();

  React.useEffect(() => {
    if (user) {
      fetchUnreadCount();

      // Real-time subscription for new notifications
      const channel = supabase
        .channel('notifications_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchUnreadCount();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  return (
    <div className="flex-1 bg-neutral-50 dark:bg-[#0a0a0a] p-6 overflow-auto min-h-screen text-black dark:text-white relative">
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        userId={user?.id}
      />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Welcome back to your dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 rounded-lg bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors group"
          >
            <Bell className="h-5 w-5 group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold border-2 border-white dark:border-[#0a0a0a]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="font-medium text-neutral-600 dark:text-neutral-400 mb-1">Total Deploys</h3>
          <p className="text-2xl font-bold">{stats?.totalApps || 0}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">Apps deployed</p>
        </div>

        {/* Downloads */}
        <div className="p-6 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
              <Download className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="font-medium text-neutral-600 dark:text-neutral-400 mb-1">Downloads</h3>
          <p className="text-2xl font-bold">{stats?.totalDownloads || 0}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">All time downloads</p>
        </div>

        {/* Total Views (was Apps) */}
        <div className="p-6 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
              <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="font-medium text-neutral-600 dark:text-neutral-400 mb-1">Total Views</h3>
          <p className="text-2xl font-bold">{stats?.totalViews || 0}</p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">All time views</p>
        </div>

        {/* Conversion Rate */}
        <div className="p-6 rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg">
              <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </div>
          <h3 className="font-medium text-neutral-600 dark:text-neutral-400 mb-1">Conversion Rate</h3>
          <p className="text-2xl font-bold">
            {stats.totalViews > 0
              ? ((stats.totalDownloads / stats.totalViews) * 100).toFixed(1)
              : "0.0"}%
          </p>
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">Downloads per view</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Deployments</h3>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {deployments && deployments.length > 0 ? (
                deployments.map((deploy, i) => {
                  const appName = deploy.apps?.name || deploy.build_meta?.project_name || 'Unknown App';
                  const appIcon = deploy.apps?.icon_url;

                  return (
                    <div key={i} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-white/10">
                      <div className={`relative h-10 w-10 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center
                                    ${appIcon ? 'bg-neutral-100 dark:bg-white/10' :
                          deploy.status === 'success' ? 'bg-green-500/10 text-green-500' :
                            deploy.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                              deploy.status === 'building' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                                'bg-yellow-500/10 text-yellow-500'}`}>
                        {appIcon ? (
                          <Image
                            src={appIcon}
                            alt={appName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          deploy.status === 'success' ? <CheckCircle className="h-5 w-5" /> :
                            deploy.status === 'failed' ? <XCircle className="h-5 w-5" /> :
                              deploy.status === 'building' ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                <Clock className="h-5 w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col">
                          <p className="text-sm font-medium truncate">
                            {appName}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                            {deploy.commit_message || `Deployment #${deploy.id.slice(0, 8)}`} • {deploy.version || 'v0.0.1'}
                          </p>
                        </div>
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                        {deploy.created_at ? formatDistanceToNow(new Date(deploy.created_at), { addSuffix: true }) : 'Just now'}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-neutral-500 text-sm py-4 text-center">No deployments yet</div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Recent Activity</h3>
              <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                View all
              </button>
            </div>
            <div className="space-y-4">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                      <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Uploaded {activity.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        Version {activity.version || '1.0.0'}
                      </p>
                    </div>
                    <div className="text-xs text-neutral-400 dark:text-neutral-500">
                      {activity.created_at ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true }) : 'Recently'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-neutral-500 text-sm py-4 text-center">No recent activity</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <AnalyticsCard
            title="Streak"
            totalAmount={stats?.streak?.toString() || "0"}
            icon={<Flame className="h-4 w-4 text-orange-500" />}
            data={dailyActivity || [
              { label: "Mon", value: 0 },
              { label: "Tue", value: 0 },
              { label: "Wed", value: 0 },
            ]}
            className="w-full rounded-xl border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm"
          />

          <div className="rounded-xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Top Apps</h3>
            <div className="space-y-3">
              {topApps && topApps.length > 0 ? (
                topApps.map((app, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-white/5 last:border-0 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors p-2 rounded-lg cursor-default">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 min-w-8 rounded bg-neutral-100 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-neutral-500 overflow-hidden relative">
                        {app.icon_url ? (
                          <Image
                            src={app.icon_url}
                            alt={app.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-400 font-medium truncate">{app.name}</span>
                    </div>
                    <span className="text-sm font-bold whitespace-nowrap ml-2">
                      {app.download_count || 0}
                      <span className="text-xs text-neutral-400 font-normal ml-1">dl</span>
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-neutral-500 text-center py-4">No top apps</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}