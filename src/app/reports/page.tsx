
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart2 className="me-2 h-6 w-6 text-primary" />
            التقارير والتحليل
          </CardTitle>
          <CardDescription>إنشاء وعرض تقارير مخصصة وتحليلات لجميع وحدات النظام.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة التقارير والتحليل سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
