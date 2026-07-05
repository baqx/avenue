'use client';

import React from 'react';
import { useGetOverviewStatsQuery } from '@/lib/api/analyticsApi';
import { CardShimmer } from '@/components/ui/Shimmer';
import { Wallet, ArrowsLeftRight, WarningOctagon, PlugsConnected } from '@phosphor-icons/react';

function StatCard({ title, value, icon: Icon, subtitle }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-gray-50 rounded-xl text-gray-600">
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      </div>
      <div className="mt-auto">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useGetOverviewStatsQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardShimmer />
          <CardShimmer />
          <CardShimmer />
          <CardShimmer />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600">
        Failed to load overview statistics. Please try again.
      </div>
    );
  }

  const formatCurrency = (kobo: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(kobo / 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Volume"
          value={formatCurrency(stats.total_volume_kobo)}
          subtitle={`${formatCurrency(stats.volume_today_kobo)} today`}
          icon={ArrowsLeftRight}
        />
        <StatCard
          title="Active Wallets"
          value={stats.active_wallets}
          subtitle={`${stats.total_wallets} total provisioned`}
          icon={Wallet}
        />
        <StatCard
          title="Suspense Queue"
          value={stats.pending_suspense_count}
          subtitle="Awaiting manual review"
          icon={WarningOctagon}
        />
        <StatCard
          title="Webhook Delivery"
          value={`${(stats.webhook_delivery_rate * 100).toFixed(1)}%`}
          subtitle="Success rate"
          icon={PlugsConnected}
        />
      </div>

      <div className="mt-8">
        {/* Placeholder for Recent Transactions or other widgets */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h2>
          <p className="text-gray-600">
            Welcome to Avenue. Start by provisioning a virtual wallet for a customer, or explore the API documentation to integrate webhooks.
          </p>
        </div>
      </div>
    </div>
  );
}
