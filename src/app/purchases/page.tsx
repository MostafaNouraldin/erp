
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

export default function PurchasesPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="me-2 h-6 w-6 text-primary" />
            المشتريات
          </CardTitle>
          <CardDescription>إدارة أوامر الشراء، فواتير الموردين، وعمليات الاستلام.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة المشتريات سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
