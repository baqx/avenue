'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateWalletMutation } from '@/lib/api/walletsApi';
import { useToast } from '@/components/ui/toast/ToastProvider';
import { ArrowLeft, CircleNotch } from '@phosphor-icons/react';

export default function NewWalletPage() {
  const router = useRouter();
  const toast = useToast();
  const [createWallet, { isLoading }] = useCreateWalletMutation();
  const [formData, setFormData] = useState({
    customer_reference: '',
    first_name: '',
    last_name: '',
    email: '',
    label: '',
    system_prompt: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createWallet(formData).unwrap();
      toast.success('Wallet provisioned', 'A new virtual account has been successfully created via Nomba.');
      router.push('/dashboard/wallets');
    } catch (err: any) {
      toast.error('Provisioning failed', err?.data?.error?.message || err?.data?.detail || 'Could not provision the wallet. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/wallets" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Wallets
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Provision New Wallet</h1>
        <p className="mt-1 text-sm text-gray-500">Create a dedicated virtual account and ledger for a customer.</p>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="customer_reference" className="block text-sm font-medium text-gray-700">Customer Reference <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="customer_reference"
                id="customer_reference"
                required
                value={formData.customer_reference}
                onChange={handleChange}
                placeholder="e.g. user_987"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">Your internal unique ID for this user.</p>
            </div>

            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="first_name"
                id="first_name"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="last_name"
                id="last_name"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address <span className="text-red-500">*</span></label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2 border-t border-gray-200 pt-6 mt-2">
              <label htmlFor="label" className="block text-sm font-medium text-gray-700">Internal Label (Optional)</label>
              <input
                type="text"
                name="label"
                id="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="e.g. John Doe — School Fees"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="system_prompt" className="block text-sm font-medium text-gray-700">AI System Prompt (Optional)</label>
              <textarea
                name="system_prompt"
                id="system_prompt"
                rows={3}
                value={formData.system_prompt}
                onChange={handleChange}
                placeholder="Instruct the AI on how to handle incoming transfers for this wallet..."
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
              />
              <p className="mt-2 text-xs text-gray-500">Example: "This wallet collects school fees. Flag anything under 50,000 as an underpayment."</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Link
              href="/dashboard/wallets"
              className="inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex justify-center items-center rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading && <CircleNotch className="w-4 h-4 mr-2 animate-spin" />}
              Provision Wallet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
