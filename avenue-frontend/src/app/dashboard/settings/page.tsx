"use client";

import { useState } from "react";
import { Key, Link as LinkIcon, User, Plus, Trash, Eye, EyeClosed, PlugsConnected, ArrowClockwise } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"keys" | "nomba" | "profile">("keys");
  const [showLiveKey, setShowLiveKey] = useState(false);

  return (
    <PageReveal>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#022c22] tracking-tight">Settings</h1>
        <p className="text-[#6a6c6c] mt-1">Manage your API keys, Nomba integration, and profile.</p>
      </div>

      <div className="bg-white rounded-xl border border-[#e4e7e9] shadow-sm overflow-hidden flex flex-col mb-8">
        <div className="flex border-b border-[#e4e7e9] bg-[#f7f9fb] px-4 pt-4 gap-6 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab("keys")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "keys" ? "border-[#10b981] text-[#022c22]" : "border-transparent text-[#6a6c6c] hover:text-[#022c22]"}`}
          >
            <Key weight={activeTab === "keys" ? "fill" : "regular"} />
            API Keys
          </button>
          <button 
            onClick={() => setActiveTab("nomba")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "nomba" ? "border-[#10b981] text-[#022c22]" : "border-transparent text-[#6a6c6c] hover:text-[#022c22]"}`}
          >
            <LinkIcon weight={activeTab === "nomba" ? "fill" : "regular"} />
            Nomba Integration
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${activeTab === "profile" ? "border-[#10b981] text-[#022c22]" : "border-transparent text-[#6a6c6c] hover:text-[#022c22]"}`}
          >
            <User weight={activeTab === "profile" ? "fill" : "regular"} />
            Profile Details
          </button>
        </div>

        <div className="p-6">
          {activeTab === "keys" && (
            <div className="space-y-8 max-w-3xl">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[#022c22]">Live Secret Key</h3>
                  <Button variant="outline" className="h-8 text-xs gap-1.5 border-[#e4e7e9] text-[#022c22]">
                    <ArrowClockwise weight="bold" /> Roll Key
                  </Button>
                </div>
                <div className="relative">
                  <input 
                    type={showLiveKey ? "text" : "password"}
                    defaultValue="ave_live_pk_98sdf8s7df8s7df87s8df7"
                    readOnly
                    className="w-full h-11 pl-3.5 pr-24 rounded-lg border border-[#10b981]/50 bg-[#f0fdf4] text-sm outline-none text-[#022c22] font-mono font-bold"
                  />
                  <button 
                    onClick={() => setShowLiveKey(!showLiveKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-white border border-[#10b981]/30 px-2 py-1 rounded hover:bg-[#f0fdf4] transition-colors"
                  >
                    {showLiveKey ? <><EyeClosed weight="bold" /> Hide</> : <><Eye weight="bold" /> Reveal</>}
                  </button>
                </div>
                <p className="text-xs text-[#6a6c6c] mt-2">Only use this key in your secure backend server. Do not expose it in frontend code.</p>
              </div>

              <div className="h-px bg-[#e4e7e9] w-full" />

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-[#022c22]">Test Secret Key</h3>
                  <Button variant="outline" className="h-8 text-xs gap-1.5 border-[#e4e7e9] text-[#022c22]">
                    <ArrowClockwise weight="bold" /> Roll Key
                  </Button>
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    defaultValue="ave_test_pk_12345abcdefghijk"
                    readOnly
                    className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] bg-[#f7f9fb] text-sm outline-none text-[#6a6c6c] font-mono"
                  />
                </div>
                <p className="text-xs text-[#6a6c6c] mt-2">Use this key to safely simulate transactions and webhooks without real money.</p>
              </div>
            </div>
          )}

          {activeTab === "nomba" && (
            <div className="space-y-6 max-w-xl">
              <div className="bg-[#f0fdf4] border border-[#10b981]/30 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <span className="font-bold text-[#022c22]">N</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-[#022c22]">Nomba Production Status</h4>
                    <p className="text-xs text-[#059669] font-semibold mt-0.5 flex items-center gap-1">
                      <PlugsConnected weight="bold" /> Connected and active
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 text-xs h-8">
                  Disconnect
                </Button>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#022c22]">Client ID</label>
                <input 
                  type="text"
                  defaultValue="nomba_client_891238923"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#022c22]">Client Secret</label>
                <input 
                  type="password"
                  defaultValue="nomba_secret_129381902830"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22]"
                />
              </div>
              
              <Button className="bg-[#022c22] text-white hover:bg-[#064e3b]">Update Credentials</Button>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 max-w-xl">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-16 h-16 bg-[#022c22] rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-xl font-bold">Z</span>
                </div>
                <Button variant="outline" className="border-[#e4e7e9] text-[#022c22] text-xs h-8">
                  Upload Logo
                </Button>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#022c22]">Company Name</label>
                <input 
                  type="text"
                  defaultValue="Zenith Pay"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#022c22]">Developer Email</label>
                <input 
                  type="email"
                  defaultValue="dev@zenithpay.co"
                  className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22]"
                />
              </div>
              
              <Button className="bg-[#022c22] text-white hover:bg-[#064e3b]">Save Profile</Button>

              <div className="border-t border-[#e4e7e9] mt-8 pt-8">
                <h3 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h3>
                <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                  <Trash weight="bold" className="mr-2" /> Delete Account
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageReveal>
  );
}
// ArrowClockwise icon import missing above, will need to add it inline or rely on Next.js auto import? Actually it wasn't imported. I will add it via replace_file_content if I get an error, wait I can just use replace_file_content right now to add ArrowClockwise to imports.
