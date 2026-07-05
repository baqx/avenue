"use client";

import { useState } from "react";
import { Key, Link as LinkIcon, User, Plus, Trash, Eye, EyeClosed, PlugsConnected, ArrowClockwise, WarningCircle } from "@phosphor-icons/react";
import { PageReveal } from "@/components/ui/PageReveal";
import { Button } from "@/components/ui/Button";
import { 
  useGetProfileQuery, 
  useUpdateProfileMutation,
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
  useGetNombaConfigQuery,
  useConfigureNombaMutation
} from "@/lib/api/developerApi";
import { useToast } from "@/components/ui/toast/ToastProvider";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"keys" | "nomba" | "profile">("keys");
  
  // Profile State
  const { data: profileData, isLoading: isProfileLoading } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [profileForm, setProfileForm] = useState({ company_name: '', email: '' });
  
  // Nomba Config State
  const { data: nombaData, isLoading: isNombaLoading } = useGetNombaConfigQuery();
  const [configureNomba, { isLoading: isConfiguringNomba }] = useConfigureNombaMutation();
  const [nombaForm, setNombaForm] = useState({ account_id: '', client_id: '', client_secret: '', webhook_signature_key: '' });

  // Keys State
  const { data: keysData, isLoading: isKeysLoading } = useGetApiKeysQuery();
  const [createKey, { isLoading: isCreatingKey }] = useCreateApiKeyMutation();
  const [deleteKey] = useDeleteApiKeyMutation();
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  
  // For showing the newly created full_key once
  const [newlyCreatedKeys, setNewlyCreatedKeys] = useState<Record<string, string>>({});

  const toast = useToast();

  const handleProfileUpdate = async () => {
    try {
      const payload: any = {};
      if (profileForm.company_name) payload.company_name = profileForm.company_name;
      if (profileForm.email) payload.email = profileForm.email;
      if (Object.keys(payload).length === 0) return;
      
      await updateProfile(payload).unwrap();
      toast.success("Profile Updated", "Your profile details have been saved.");
    } catch (err: any) {
      toast.error("Update Failed", err?.data?.error?.message || "Could not update profile.");
    }
  };

  const handleNombaUpdate = async () => {
    try {
      if (!nombaForm.account_id || !nombaForm.client_id || !nombaForm.client_secret || !nombaForm.webhook_signature_key) {
        toast.error("Validation Error", "All fields are required to configure Nomba.");
        return;
      }
      await configureNomba(nombaForm).unwrap();
      toast.success("Integration Saved", "Nomba credentials have been updated successfully.");
      setNombaForm({ account_id: '', client_id: '', client_secret: '', webhook_signature_key: '' });
    } catch (err: any) {
      toast.error("Integration Failed", err?.data?.error?.message || "Could not update Nomba credentials.");
    }
  };

  const handleCreateKey = async (type: "live" | "test") => {
    try {
      const res = await createKey({ type, label: `My ${type === 'live' ? 'Production' : 'Staging'} Key` }).unwrap();
      toast.success("Key Created", `A new ${type} key was successfully generated.`);
      setNewlyCreatedKeys(prev => ({ ...prev, [res.id]: res.full_key }));
      setRevealedKeys(prev => ({ ...prev, [res.id]: true }));
    } catch (err: any) {
      toast.error("Failed to create key", err?.data?.error?.message || "Could not generate key.");
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    try {
      await deleteKey(keyId).unwrap();
      toast.success("Key Deleted", "The API key was permanently deleted.");
    } catch (err: any) {
      toast.error("Failed to delete key", err?.data?.error?.message || "Could not delete key.");
    }
  };

  const toggleKeyReveal = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-[#022c22]">Developer API Keys</h3>
                  <p className="text-sm text-[#6a6c6c]">Manage your secret keys for API access.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleCreateKey("test")} variant="outline" className="h-9 gap-2 text-sm border-[#e4e7e9] text-[#022c22]" disabled={isCreatingKey}>
                    <Plus weight="bold" /> New Test Key
                  </Button>
                  <Button onClick={() => handleCreateKey("live")} className="h-9 gap-2 text-sm bg-[#022c22] text-white hover:bg-[#064e3b]" disabled={isCreatingKey}>
                    <Plus weight="bold" /> New Live Key
                  </Button>
                </div>
              </div>

              {isKeysLoading ? (
                <div className="animate-pulse flex flex-col gap-4">
                  <div className="h-20 bg-[#f7f9fb] rounded-xl w-full"></div>
                  <div className="h-20 bg-[#f7f9fb] rounded-xl w-full"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {keysData?.map(key => {
                    const isNewlyCreated = !!newlyCreatedKeys[key.id];
                    const isRevealed = revealedKeys[key.id];
                    const displayValue = isNewlyCreated && isRevealed 
                      ? newlyCreatedKeys[key.id] 
                      : (isRevealed ? `${key.key_prefix}*****************` : `${key.key_prefix}*****************`); // Masked unless newly created

                    return (
                      <div key={key.id} className="border border-[#e4e7e9] rounded-xl p-5">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="font-bold text-[#022c22] flex items-center gap-2">
                              {key.label || "Secret Key"}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${key.type === 'live' ? 'bg-[#f0fdf4] text-[#059669] border-[#10b981]/30' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                {key.type}
                              </span>
                            </h4>
                            <p className="text-xs text-[#6a6c6c] mt-1">Created on {new Date(key.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button onClick={() => handleDeleteKey(key.id)} variant="outline" className="h-8 w-8 p-0 text-red-500 border-red-100 hover:bg-red-50">
                            <Trash weight="bold" />
                          </Button>
                        </div>
                        <div className="relative">
                          <input 
                            type={isRevealed ? "text" : "password"}
                            value={displayValue}
                            readOnly
                            className={`w-full h-11 pl-3.5 pr-24 rounded-lg border text-sm outline-none font-mono font-bold ${key.type === 'live' ? 'border-[#10b981]/50 bg-[#f0fdf4] text-[#022c22]' : 'border-[#e4e7e9] bg-[#f7f9fb] text-[#6a6c6c]'}`}
                          />
                          <button 
                            onClick={() => toggleKeyReveal(key.id)}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold bg-white border px-2 py-1 rounded transition-colors ${key.type === 'live' ? 'text-[#059669] border-[#10b981]/30 hover:bg-[#f0fdf4]' : 'text-[#6a6c6c] border-[#e4e7e9] hover:bg-[#f7f9fb]'}`}
                          >
                            {isRevealed ? <><EyeClosed weight="bold" /> Hide</> : <><Eye weight="bold" /> Reveal</>}
                          </button>
                        </div>
                        {isNewlyCreated && (
                          <p className="text-xs text-amber-600 mt-2 font-semibold flex items-center gap-1">
                            <WarningCircle weight="fill" /> Please copy this key now. You will not be able to see it again.
                          </p>
                        )}
                        {!isNewlyCreated && key.type === 'live' && (
                          <p className="text-xs text-[#6a6c6c] mt-2">Only use this key in your secure backend server. Do not expose it in frontend code.</p>
                        )}
                      </div>
                    );
                  })}
                  {(!keysData || keysData.length === 0) && (
                    <div className="text-center p-8 border border-dashed border-[#e4e7e9] rounded-xl text-[#6a6c6c]">
                      No API keys generated yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "nomba" && (
            <div className="space-y-6 max-w-xl">
              {isNombaLoading ? (
                 <div className="animate-pulse h-32 bg-[#f7f9fb] rounded-xl w-full"></div>
              ) : nombaData ? (
                <div className="bg-[#f0fdf4] border border-[#10b981]/30 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                      <span className="font-bold text-[#022c22]">N</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-[#022c22]">Nomba Production Status</h4>
                      <p className="text-xs text-[#059669] font-semibold mt-0.5 flex items-center gap-1">
                        <PlugsConnected weight="bold" /> Connected to Account ID: {nombaData.account_id}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-[#10b981]/30 text-[#059669] hover:bg-[#f0fdf4] text-xs h-8">
                    Active
                  </Button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
                  <WarningCircle weight="fill" className="text-amber-500 w-8 h-8" />
                  <div>
                    <h4 className="font-bold text-[#92400e]">Nomba Not Configured</h4>
                    <p className="text-xs text-[#b45309] mt-0.5">Please provide your Nomba credentials to enable automatic suspense reconciliation and virtual account issuance.</p>
                  </div>
                </div>
              )}

              <div className="h-px bg-[#e4e7e9] w-full" />

              <h4 className="font-bold text-[#022c22]">Update Credentials</h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#022c22]">Nomba Account ID</label>
                  <input 
                    type="text"
                    value={nombaForm.account_id}
                    onChange={e => setNombaForm({...nombaForm, account_id: e.target.value})}
                    placeholder={nombaData?.account_id || "Enter your Nomba Account ID"}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#022c22]">Client ID</label>
                  <input 
                    type="text"
                    value={nombaForm.client_id}
                    onChange={e => setNombaForm({...nombaForm, client_id: e.target.value})}
                    placeholder={nombaData?.client_id || "Enter your Nomba Client ID"}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#022c22]">Client Secret</label>
                  <input 
                    type="password"
                    value={nombaForm.client_secret}
                    onChange={e => setNombaForm({...nombaForm, client_secret: e.target.value})}
                    placeholder={nombaData ? "••••••••••••••••" : "Enter your Nomba Client Secret"}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[#022c22]">Webhook Signature Key</label>
                  <input 
                    type="password"
                    value={nombaForm.webhook_signature_key}
                    onChange={e => setNombaForm({...nombaForm, webhook_signature_key: e.target.value})}
                    placeholder={nombaData ? "••••••••••••••••" : "Enter Webhook Signature Key from Nomba"}
                    className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                  />
                </div>
                
                <Button onClick={handleNombaUpdate} disabled={isConfiguringNomba} className="bg-[#022c22] text-white hover:bg-[#064e3b] w-full sm:w-auto">
                  {isConfiguringNomba ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="space-y-6 max-w-xl">
              {isProfileLoading ? (
                 <div className="animate-pulse flex items-center gap-4 mb-2">
                    <div className="w-16 h-16 bg-[#e4e7e9] rounded-full"></div>
                 </div>
              ) : (
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-16 h-16 bg-[#022c22] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xl font-bold">{profileData?.company_name?.[0]?.toUpperCase() || 'A'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-[#022c22] text-lg">{profileData?.company_name || 'Your Company'}</h3>
                    <p className="text-sm text-[#6a6c6c]">Manage your developer profile details.</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#022c22]">Company Name</label>
                <input 
                  type="text"
                  value={profileForm.company_name}
                  onChange={e => setProfileForm({...profileForm, company_name: e.target.value})}
                  placeholder={profileData?.company_name || "Enter company name"}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#022c22]">Developer Email</label>
                <input 
                  type="email"
                  value={profileForm.email}
                  onChange={e => setProfileForm({...profileForm, email: e.target.value})}
                  placeholder={profileData?.email || "Enter developer email"}
                  className="w-full h-11 px-3.5 rounded-lg border border-[#e4e7e9] text-sm outline-none bg-white text-[#022c22] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20"
                />
              </div>
              
              <Button onClick={handleProfileUpdate} disabled={isUpdatingProfile} className="bg-[#022c22] text-white hover:bg-[#064e3b]">
                {isUpdatingProfile ? "Saving..." : "Save Profile"}
              </Button>

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
