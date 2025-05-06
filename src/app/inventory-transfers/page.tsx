
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Truck } from "lucide-react";

export default function InventoryTransfersPage() {
  return (
    <div className="container mx-auto py-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="me-2 h-6 w-6 text-primary" />
            تحويلات المخزون
          </CardTitle>
          <CardDescription>إدارة عمليات تحويل الأصناف بين المستودعات والفروع المختلفة.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>محتوى صفحة تحويلات المخزون سيتم إضافته هنا.</p>
          <p className="mt-4 text-muted-foreground">هذه الصفحة قيد الإنشاء حاليًا.</p>
        </CardContent>
      </Card>
    </div>
  );
}
