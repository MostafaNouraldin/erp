
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function POSPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="me-2 h-6 w-6 text-primary" />
            نقاط البيع (POS)
          </CardTitle>
          <CardDescription>إدارة عمليات البيع بالتجزئة، طباعة الإيصالات، وإدارة المخزون في نقاط البيع.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة نقاط البيع سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
