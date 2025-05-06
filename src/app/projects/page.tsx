
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="me-2 h-6 w-6 text-primary" />
            إدارة المشاريع
          </CardTitle>
          <CardDescription>تخطيط المشاريع، تتبع المهام، إدارة الموارد، ومراقبة الميزانيات والجداول الزمنية.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة إدارة المشاريع سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
