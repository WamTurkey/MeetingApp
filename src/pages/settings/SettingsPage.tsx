import { Settings, Database, FolderOpen, Shield, Info, HardDrive, Download } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card, CardContent } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { APP_NAME, APP_VERSION } from "@/shared/config/constants";

function SettingCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">{icon}</div>
          <h3 className="font-semibold text-surface-900 dark:text-surface-50">{title}</h3>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Ayarlar</h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">Uygulama, yedekleme ve genel yapılandırma ayarları.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SettingCard icon={<FolderOpen className="h-5 w-5" />} title="PDF Tutanak Klasörü">
          <p className="text-sm text-surface-600 dark:text-surface-400">~/Documents/Toplantı Not Tutanak/Tutanaklar</p>
          <Button variant="outline" size="sm" icon={<FolderOpen className="h-4 w-4" />}>Klasörü Aç</Button>
        </SettingCard>

        <SettingCard icon={<HardDrive className="h-5 w-5" />} title="Yedek Klasörü">
          <p className="text-sm text-surface-600 dark:text-surface-400">~/Documents/Toplantı Not Tutanak/Yedekler</p>
          <Button variant="outline" size="sm" icon={<FolderOpen className="h-4 w-4" />}>Klasörü Aç</Button>
        </SettingCard>

        <SettingCard icon={<Database className="h-5 w-5" />} title="Veritabanı">
          <p className="text-sm text-surface-600 dark:text-surface-400">SQLite veritabanı lokalde saklanır. Sürüm yükseltmelerinde otomatik yedek alınır.</p>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" icon={<Download className="h-4 w-4" />}>Yedek Kaydet</Button>
          </div>
          <p className="text-xs text-surface-400">Günün ilk açılışında otomatik yedek alınır.</p>
        </SettingCard>

        <SettingCard icon={<Shield className="h-5 w-5" />} title="Güvenlik">
          <p className="text-sm text-surface-600 dark:text-surface-400">Oturum ve kimlik doğrulama ayarları.</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
              <span className="text-sm text-surface-700 dark:text-surface-300">İki faktörlü doğrulama</span>
              <Badge variant="default" size="sm">Kapalı</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
              <span className="text-sm text-surface-700 dark:text-surface-300">Oturum süresi</span>
              <Badge variant="success" size="sm">24 saat</Badge>
            </div>
          </div>
        </SettingCard>

        <SettingCard icon={<Info className="h-5 w-5" />} title="Uygulama Bilgileri">
          <div className="space-y-2">
            {[
              ["Uygulama", APP_NAME],
              ["Sürüm", APP_VERSION],
              ["Çalışma biçimi", "Web tabanlı (React)"],
              ["Tema", "Sistem ayarını izle"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
                <span className="text-sm text-surface-500 dark:text-surface-400">{label}</span>
                <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{value}</span>
              </div>
            ))}
          </div>
        </SettingCard>

        <SettingCard icon={<Settings className="h-5 w-5" />} title="Gelişmiş">
          <p className="text-sm text-surface-600 dark:text-surface-400">Verileri dışarı aktarma, önbellek temizleme ve geliştirici araçları.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Önbelleği Temizle</Button>
            <Button variant="outline" size="sm">Verileri Dışa Aktar</Button>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}
