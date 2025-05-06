
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export default function SalesPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="me-2 h-6 w-6 text-primary" />
            المبيعات
          </CardTitle>
          <CardDescription>إدارة عمليات البيع، الفواتير، وعروض الأسعار.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة المبيعات سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
