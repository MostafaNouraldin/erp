
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Cog } from "lucide-react";

export default function ProductionPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cog className="me-2 h-6 w-6 text-primary" />
            الإنتاج والتصنيع
          </CardTitle>
          <CardDescription>إدارة أوامر العمل، قائمة المواد (BOM)، تخطيط موارد الإنتاج، ومراقبة الجودة.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة الإنتاج والتصنيع سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
