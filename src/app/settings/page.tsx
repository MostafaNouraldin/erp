
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react"; // Renamed to avoid conflict

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="me-2 h-6 w-6 text-primary" />
            الإعدادات
          </CardTitle>
          <CardDescription>إدارة إعدادات النظام العامة، المستخدمين والصلاحيات، وتخصيص الوحدات.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة الإعدادات سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
