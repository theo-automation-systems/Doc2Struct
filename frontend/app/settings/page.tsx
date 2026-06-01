"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  User,
  Bell,
  Shield,
  Plug,
  CreditCard,
  Key,
  Globe,
  Moon,
  Laptop,
  Sun,
  Check,
  ChevronRight,
  ExternalLink,
  Zap,
  Database,
  Mail,
  Eye,
  EyeOff,
  Copy,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const settingsSections = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "billing", label: "Billing & Plan", icon: CreditCard },
  { id: "api", label: "API Keys", icon: Key },
];

function SettingRow({ label, description, children }: { label: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-border last:border-0">
      <div className="mr-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [theme, setTheme] = useState("system");
  const [notifications, setNotifications] = useState({
    emailOnComplete: true,
    emailOnError: true,
    weeklyDigest: false,
    slackNotif: false,
  });

  // API Keys stored in localStorage
  const [openaiKey, setOpenaiKey] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("openai_api_key") ?? "" : ""
  );
  const [keyVisible, setKeyVisible] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  const saveOpenaiKey = () => {
    localStorage.setItem("openai_api_key", openaiKey);
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  };

  return (
    <MainLayout title="Settings" subtitle="Manage your account preferences and integrations">
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-56 shrink-0 border-r border-border p-3 space-y-0.5">
          {settingsSections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors",
                activeSection === section.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <section.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">{section.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl space-y-6"
          >
            {activeSection === "profile" && (
              <>
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="text-sm font-semibold mb-4">Personal Information</h3>
                  <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                    <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                      TH
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Théo B.</p>
                      <p className="text-xs text-muted-foreground">theo@digitalflow.io</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 text-xs ml-auto">Change Photo</Button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { label: "Full Name", value: "Théo B." },
                      { label: "Email Address", value: "theo@digitalflow.io" },
                      { label: "Company", value: "DigitalFlow Ltd." },
                      { label: "Role", value: "Administrator" },
                    ].map((field) => (
                      <div key={field.label}>
                        <label className="text-xs font-medium text-muted-foreground block mb-1.5">{field.label}</label>
                        <input
                          defaultValue={field.value}
                          className="w-full px-3 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    ))}
                    <Button size="sm" className="h-8 text-xs mt-2">Save Changes</Button>
                  </div>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="text-sm font-semibold mb-4">Appearance</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "light", label: "Light", icon: Sun },
                      { id: "dark", label: "Dark", icon: Moon },
                      { id: "system", label: "System", icon: Laptop },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          "p-3 rounded-xl border text-center transition-all",
                          theme === t.id ? "border-primary bg-primary/8 text-primary" : "border-border hover:border-border/80 text-muted-foreground"
                        )}
                      >
                        <t.icon className="w-4 h-4 mx-auto mb-1.5" />
                        <span className="text-xs font-medium">{t.label}</span>
                        {theme === t.id && <Check className="w-3 h-3 mx-auto mt-1 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeSection === "notifications" && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-4">Notification Preferences</h3>
                <SettingRow label="Email on completion" description="Get notified when document extraction completes">
                  <Switch
                    checked={notifications.emailOnComplete}
                    onCheckedChange={(v) => setNotifications(n => ({ ...n, emailOnComplete: v }))}
                  />
                </SettingRow>
                <SettingRow label="Email on errors" description="Get notified when processing fails">
                  <Switch
                    checked={notifications.emailOnError}
                    onCheckedChange={(v) => setNotifications(n => ({ ...n, emailOnError: v }))}
                  />
                </SettingRow>
                <SettingRow label="Weekly digest" description="Receive a weekly summary of processed documents">
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(v) => setNotifications(n => ({ ...n, weeklyDigest: v }))}
                  />
                </SettingRow>
                <SettingRow label="Slack notifications" description="Send alerts to your Slack workspace">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">Pro</Badge>
                    <Switch checked={false} disabled />
                  </div>
                </SettingRow>
              </div>
            )}

            {activeSection === "integrations" && (
              <div className="space-y-3">
                {[
                  { name: "Notion", desc: "Export data directly to Notion databases", connected: false, icon: "N", color: "bg-gray-900 text-white", premium: false },
                  { name: "Google Drive", desc: "Import documents from Google Drive", connected: true, icon: "G", color: "bg-blue-500 text-white", premium: false },
                  { name: "Slack", desc: "Receive processing notifications in Slack", connected: false, icon: "S", color: "bg-violet-500 text-white", premium: true },
                  { name: "Zapier", desc: "Connect to 5000+ apps via Zapier webhooks", connected: false, icon: "Z", color: "bg-orange-500 text-white", premium: true },
                  { name: "OpenAI", desc: "AI extraction engine — configure your API key", connected: true, icon: "AI", color: "bg-emerald-600 text-white", premium: false },
                ].map((integration, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 shadow-sm"
                  >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0", integration.color)}>
                      {integration.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{integration.name}</p>
                        {integration.premium && <Badge variant="secondary" className="text-[10px]">Pro</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{integration.desc}</p>
                    </div>
                    {integration.connected ? (
                      <Badge className="text-[11px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">Connected</Badge>
                    ) : (
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        Connect <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}

            {activeSection === "api" && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="text-sm font-semibold mb-1">API Keys</h3>
                <p className="text-xs text-muted-foreground mb-5">Use these keys to access the Doc2Struct API programmatically.</p>
                <div className="space-y-3">
                  {[
                    { name: "Production Key", key: "ds_prod_••••••••••••••••••••4f2a", created: "Dec 1, 2025", lastUsed: "2 hours ago" },
                    { name: "Development Key", key: "ds_dev_••••••••••••••••••••9b1c", created: "Nov 15, 2025", lastUsed: "Yesterday" },
                  ].map((apiKey, i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold">{apiKey.name}</p>
                        <Button variant="ghost" size="sm" className="h-6 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-500/5">Revoke</Button>
                      </div>
                      <code className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border block mb-2">
                        {apiKey.key}
                      </code>
                      <p className="text-[11px] text-muted-foreground">Created {apiKey.created} · Last used {apiKey.lastUsed}</p>
                    </div>
                  ))}
                  <Button size="sm" className="h-8 text-xs gap-1.5">
                    <Key className="w-3.5 h-3.5" /> Generate New Key
                  </Button>
                </div>
              </div>
            )}

            {activeSection === "api" && (
              <div className="space-y-4">
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold">OpenAI API Key</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Votre clé est stockée localement dans votre navigateur et envoyée directement au backend lors des extractions. Elle n&apos;est jamais sauvegardée côté serveur.
                  </p>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type={keyVisible ? "text" : "password"}
                        value={openaiKey}
                        onChange={(e) => setOpenaiKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:bg-background transition-colors pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setKeyVisible(v => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {keyVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <Button onClick={saveOpenaiKey} size="sm" className="h-9 px-4 text-xs shrink-0 gap-1.5">
                      {keySaved ? <><Check className="w-3 h-3" /> Saved</> : "Save Key"}
                    </Button>
                  </div>
                  {openaiKey && (
                    <p className="mt-2 text-[11px] text-emerald-600 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Clé configurée — les extractions utiliseront l&apos;IA réelle
                    </p>
                  )}
                  {!openaiKey && (
                    <p className="mt-2 text-[11px] text-amber-600 flex items-center gap-1">
                      ⚠ Aucune clé — le backend utilisera la variable d&apos;environnement <code className="bg-muted px-1 rounded">OPENAI_API_KEY</code>
                    </p>
                  )}
                </div>
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="text-sm font-semibold mb-1">Backend URL</h3>
                  <p className="text-xs text-muted-foreground mb-3">URL de l&apos;API FastAPI (configurée dans <code className="bg-muted px-1 rounded">.env.local</code>).</p>
                  <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg border border-border">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-sm font-mono text-muted-foreground flex-1">
                      {process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}
                    </span>
                    <button
                      onClick={() => navigator.clipboard.writeText(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "billing" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-primary/10 to-violet-500/5 rounded-2xl border border-primary/20 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-semibold">Pro Plan</p>
                      <p className="text-xs text-muted-foreground">Billed monthly</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">$79<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {["10,000 documents/month", "All automation templates", "Priority AI processing", "Notion + Zapier integrations", "API access"].map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs flex-1">Manage Plan</Button>
                    <Button size="sm" className="h-8 text-xs flex-1 gap-1">
                      <Zap className="w-3 h-3" /> Upgrade to Enterprise
                    </Button>
                  </div>
                </div>
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                  <h3 className="text-sm font-semibold mb-4">Usage This Month</h3>
                  {[
                    { label: "Documents processed", used: 2847, limit: 10000 },
                    { label: "AI extractions", used: 2689, limit: 10000 },
                    { label: "Storage", used: 1.8, limit: 50, unit: "GB" },
                  ].map((usage, i) => (
                    <div key={i} className="mb-4 last:mb-0">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">{usage.label}</span>
                        <span className="font-medium">{usage.used}{usage.unit || ""} / {usage.limit}{usage.unit || ""}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(usage.used / usage.limit) * 100}%` }}
                          transition={{ delay: 0.2, duration: 0.6 }}
                          className="h-full bg-primary rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
}
