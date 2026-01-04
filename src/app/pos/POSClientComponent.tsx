
"use client";

import { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Search, PlusCircle, MinusCircle, Trash2, Printer, UserPlus, Percent, ScanLine, History, X, CreditCard, Landmark, CircleDollarSign, UploadCloud, UserCheck, CreditCardIcon, PlayCircle, LogOut } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; 
import { useCurrency } from '@/hooks/use-currency';
import { useAuth } from '@/hooks/use-auth';
import { addSalesInvoice } from '@/app/sales/actions';
import { startPosSession, closePosSession } from './actions';
import type { PosSessionStartValues, PosCloseSessionValues } from './actions';
import placeholderImages from '@/app/lib/placeholder-images.json';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRouter } from 'next/navigation';


const CASH_CUSTOMER_ID = "__cash_customer__";

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image?: string | null;
  dataAiHint?: string | null;
}

interface Customer {
    id: string;
    name: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null | undefined;
  dataAiHint?: string | null;
}

interface RecentTransaction {
  id: string;
  time: string;
  items: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
}

interface ActiveSession {
    id: string;
    userId: string;
    openingTime: string | Date;
    openingBalance: number;
    status: "open" | "closed";
    user: { name: string };
}

interface POSClientComponentProps {
  initialData: {
    products: Product[];
    categories: string[];
    customers: Customer[];
    activeSession: ActiveSession | null;
  };
}

const getPlaceholderImage = (keywords: string | null | undefined): string => {
  if (!keywords) return 'https://picsum.photos/seed/default/200/200';
  const searchKeywords = keywords.toLowerCase().split(' ');
  for (const image of placeholderImages) {
    if (searchKeywords.some(keyword => image.keywords.includes(keyword))) {
      return image.src;
    }
  }
  return 'https://picsum.photos/seed/fallback/200/200';
};

const sessionStartSchema = z.object({
  openingBalance: z.coerce.number().min(0, "الرصيد الافتتاحي لا يمكن أن يكون سالبًا"),
});

const sessionCloseSchema = z.object({
  closingBalance: z.coerce.number().min(0, "المبلغ الفعلي لا يمكن أن يكون سالبًا"),
});


export default function POSClientComponent({ initialData }: POSClientComponentProps) {
  const [products, setProducts] = useState(initialData.products);
  const [categories, setCategories] = useState(initialData.categories);
  const [customers, setCustomers] = useState(initialData.customers);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(initialData.activeSession);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(CASH_CUSTOMER_ID); 
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const { toast } = useToast();
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const { formatCurrency } = useCurrency();
  const { user } = useAuth();
  const router = useRouter();


  const startSessionForm = useForm<z.infer<typeof sessionStartSchema>>({
    resolver: zodResolver(sessionStartSchema),
    defaultValues: { openingBalance: 0 }
  });

  const closeSessionForm = useForm<z.infer<typeof sessionCloseSchema>>({
    resolver: zodResolver(sessionCloseSchema),
    defaultValues: { closingBalance: 0 }
  });

  useEffect(() => {
    setProducts(initialData.products);
    setCategories(initialData.categories);
    setCustomers(initialData.customers);
    setActiveSession(initialData.activeSession);
  }, [initialData]);
  
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(subtotal - discount);
  }, [cart, discount]);

  const handleStartSession = async (values: z.infer<typeof sessionStartSchema>) => {
    if (!user) {
        toast({ title: "خطأ", description: "يجب تسجيل الدخول لبدء جلسة.", variant: "destructive" });
        return;
    }
    try {
        const newSession = await startPosSession({ userId: user.id, openingBalance: values.openingBalance });
        setActiveSession(newSession as ActiveSession);
        toast({ title: "تم بدء الجلسة", description: `مرحباً ${user.name}! تم بدء الجلسة برصيد افتتاحي ${formatCurrency(values.openingBalance).amount}.` });
    } catch(e: any) {
        toast({ title: "خطأ في بدء الجلسة", description: e.message, variant: "destructive" });
    }
  };

  const handleCloseSession = async (values: z.infer<typeof sessionCloseSchema>) => {
    if (!activeSession) return;
    try {
        await closePosSession(activeSession.id, values);
        setActiveSession(null);
        clearCart();
        toast({ title: "تم إغلاق الجلسة", description: "تم إغلاق الجلسة وترحيل القيود بنجاح." });
    } catch (e: any) {
        toast({ title: "خطأ في إغلاق الجلسة", description: e.message, variant: "destructive" });
    }
  };


  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, price: product.sellingPrice, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(prevCart =>
      prevCart
        .map(item =>
          item.id === productId ? { ...item, quantity: Math.max(0, item.quantity + change) } : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  const removeItem = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setSelectedCustomerId(CASH_CUSTOMER_ID);
    setPaymentMethod(null);
  };
  
  const filteredProducts = products.filter(product =>
    (selectedCategory === 'الكل' || product.category === selectedCategory) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleProcessPayment = async () => {
    const transactionId = `TRX${Date.now().toString().slice(-5)}`;
    const customer = customers.find(c => c.id === selectedCustomerId);
    const customerNameForInvoice = selectedCustomerId === CASH_CUSTOMER_ID ? 'عميل نقدي' : (customer?.name || 'عميل غير محدد');

    const isDeferred = paymentMethod === 'deferred';
    if (isDeferred && (!selectedCustomerId || selectedCustomerId === CASH_CUSTOMER_ID)) {
        toast({
            title: "خطأ",
            description: "الرجاء اختيار عميل معرف لعملية البيع الآجل.",
            variant: "destructive",
        });
        return;
    }
    
    const invoiceData = {
        customerId: selectedCustomerId || CASH_CUSTOMER_ID,
        date: new Date(),
        dueDate: isDeferred ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : new Date(),
        items: cart.map(item => ({ 
            itemId: item.id, 
            description: item.name, 
            quantity: item.quantity, 
            unitPrice: item.price, 
            total: item.price * item.quantity 
        })),
        numericTotalAmount: totalAmount,
        status: isDeferred ? "غير مدفوع" as const : "مدفوع" as const,
        isDeferredPayment: isDeferred,
        notes: `فاتورة من نقطة البيع للعميل: ${customerNameForInvoice} - طريقة الدفع: ${paymentMethod}`,
        source: "POS" as const,
        sessionId: activeSession?.id,
        paymentMethod: paymentMethod,
    };

    try {
        await addSalesInvoice(invoiceData as any);

        toast({
            title: isDeferred ? "تم تسجيل البيع الآجل بنجاح!" : "تمت عملية الدفع بنجاح!",
            description: `تم إنشاء فاتورة للعميل ${customerNameForInvoice}.`,
            variant: "default",
        });

        const newTransaction: RecentTransaction = {
            id: transactionId,
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
            items: cart.reduce((sum, item) => sum + item.quantity, 0),
            total: totalAmount,
            paymentMethod: paymentMethod === 'deferred' ? 'آجل' : (paymentMethod || "غير محدد"),
            customerName: selectedCustomerId === CASH_CUSTOMER_ID ? undefined : customer?.name,
        };
        setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 4)]);
        clearCart();

    } catch (error) {
        toast({
            title: "خطأ في إنشاء الفاتورة",
            description: (error as Error).message,
            variant: "destructive",
        });
    }
  };


  if (!activeSession) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]" dir="rtl">
            <Dialog open={true} onOpenChange={(open) => { if(!open) router.push('/'); }}>
                 <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl">بدء جلسة نقاط بيع جديدة</DialogTitle>
                        <DialogDescriptionComponent>يجب بدء جلسة جديدة لتتمكن من تسجيل المبيعات. أدخل الرصيد الافتتاحي في درج النقود.</DialogDescriptionComponent>
                    </DialogHeader>
                    <Form {...startSessionForm}>
                        <form onSubmit={startSessionForm.handleSubmit(handleStartSession)} className="space-y-4 py-4">
                            <FormField control={startSessionForm.control} name="openingBalance" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الرصيد الافتتاحي</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} className="bg-background text-lg text-center" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                                <DialogClose asChild>
                                  <Button type="button" variant="outline" className="w-full">العودة لتسجيل الدخول</Button>
                                </DialogClose>
                                <Button type="submit" className="w-full">
                                    <PlayCircle className="me-2 h-4 w-4" /> بدء الجلسة
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                 </DialogContent>
            </Dialog>
        </div>
    );
  }


  return (
    <div className="container mx-auto py-6 h-[calc(100vh-theme(spacing.24))] flex flex-col" dir="rtl">
      <Card className="shadow-lg mb-6 flex justify-between items-center">
        <CardHeader className="flex-grow">
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <CreditCardIcon className="me-2 h-8 w-8 text-primary" /> 
            نقطة البيع (POS) - جلسة نشطة
          </CardTitle>
          <CardDescription>
            الموظف: <span className="font-semibold text-primary">{activeSession.user?.name || activeSession.userId}</span> | 
            وقت البدء: {new Date(activeSession.openingTime).toLocaleTimeString('ar-SA')} | 
            الرصيد الافتتاحي: <span dangerouslySetInnerHTML={{ __html: formatCurrency(activeSession.openingBalance).amount + ' ' + formatCurrency(activeSession.openingBalance).symbol }}></span>
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
             <Dialog>
                <DialogTrigger asChild>
                    <Button variant="destructive" className="shadow-md">
                        <LogOut className="me-2 h-4 w-4" /> إغلاق الجلسة
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>إغلاق جلسة نقاط البيع</DialogTitle>
                         <DialogDescriptionComponent>أدخل المبلغ الفعلي الموجود في درج النقود لإنهاء الجلسة.</DialogDescriptionComponent>
                    </DialogHeader>
                     <Form {...closeSessionForm}>
                        <form onSubmit={closeSessionForm.handleSubmit(handleCloseSession)} className="space-y-4 py-4">
                            <FormField control={closeSessionForm.control} name="closingBalance" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المبلغ الفعلي في الصندوق</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="0.00" {...field} className="bg-background text-lg text-center" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <DialogFooter>
                                <Button type="submit" variant="destructive" className="w-full">
                                   تأكيد وإغلاق الجلسة
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow overflow-hidden">
        {/* Products Section */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <Card className="shadow-md flex-grow flex flex-col overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap gap-4 justify-between items-center">
                <div className="relative w-full sm:w-auto grow sm:grow-0">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="بحث بالاسم أو الباركود..." 
                    className="pr-10 w-full sm:w-72 bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                 <Button variant="outline" size="icon" className="shadow-sm hover:shadow-md transition-shadow">
                    <ScanLine className="h-5 w-5" />
                    <span className="sr-only">مسح باركود</span>
                 </Button>
              </div>
              <ScrollArea className="w-full whitespace-nowrap py-2">
                 <div className="flex space-x-2 rtl:space-x-reverse">
                    {categories.map(category => (
                        <Button 
                            key={category} 
                            variant={selectedCategory === category ? "default" : "outline"}
                            onClick={() => setSelectedCategory(category)}
                            className="shadow-sm hover:shadow-md transition-shadow"
                        >
                            {category}
                        </Button>
                    ))}
                 </div>
              </ScrollArea>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                  <Card 
                    key={product.id} 
                    className="cursor-pointer hover:shadow-xl transition-shadow flex flex-col items-center text-center overflow-hidden"
                    onClick={() => addToCart(product)}
                  >
                    <div className="relative w-full h-32 sm:h-36 md:h-40">
                        <Image src={product.image || getPlaceholderImage(product.dataAiHint)} alt={product.name} layout="fill" objectFit="cover" />
                    </div>
                    <CardHeader className="p-2 w-full">
                      <CardTitle className="text-sm font-semibold truncate">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 w-full">
                      <p className="text-primary font-bold text-sm" dangerouslySetInnerHTML={{ __html: formatCurrency(product.price).amount + ' ' + formatCurrency(product.price).symbol }}></p>
                      <p className="text-xs text-muted-foreground">المخزون: {product.stock}</p>
                    </CardContent>
                  </Card>
                ))}
                 {filteredProducts.length === 0 && (
                    <p className="col-span-full text-center text-muted-foreground py-10">
                        لم يتم العثور على منتجات تطابق بحثك أو الفئة المختارة.
                    </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart and Payment Section */}
        <div className="flex flex-col h-full gap-6">
          <Card className="shadow-md flex-grow flex flex-col overflow-hidden">
            <CardHeader className="flex-row justify-between items-center">
              <CardTitle className="flex items-center"><ShoppingCart className="me-2 h-5 w-5 text-primary" /> سلة المشتريات</CardTitle>
              <Button variant="ghost" size="icon" onClick={clearCart} title="إفراغ السلة">
                <X className="h-5 w-5 text-destructive" />
              </Button>
            </CardHeader>
            <ScrollArea className="flex-grow">
              <CardContent className="space-y-3 p-4">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-10">السلة فارغة.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 border rounded-md bg-muted/30">
                      <Image src={item.image || getPlaceholderImage(item.dataAiHint)} alt={item.name} width={48} height={48} className="rounded-md object-cover"/>
                      <div className="flex-grow">
                        <p className="font-semibold truncate text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatCurrency(item.price).amount + ' ' + formatCurrency(item.price).symbol }}></p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, -1)}>
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, 1)}>
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </ScrollArea>
            {cart.length > 0 && (
              <>
                <Separator />
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>المجموع الفرعي:</span>
                    <span className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(subtotal).amount + ' ' + formatCurrency(subtotal).symbol }}></span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span>الخصم:</span>
                    <div className="flex items-center gap-1 w-28">
                        <Input 
                            type="number" 
                            value={discount} 
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                            className="h-8 text-center bg-background" 
                            placeholder="0"
                        />
                        <span className="text-xs">SAR</span>
                    </div>
                  </div>
                   <Separator />
                  <div className="flex justify-between text-lg font-bold text-primary">
                    <span>الإجمالي للدفع:</span>
                    <span dangerouslySetInnerHTML={{ __html: formatCurrency(totalAmount).amount + ' ' + formatCurrency(totalAmount).symbol }}></span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full shadow-md hover:shadow-lg transition-shadow text-base py-3 h-auto" disabled={cart.length === 0}>
                        <CreditCardIcon className="me-2 h-5 w-5" /> الدفع
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md" dir="rtl">
                      <DialogHeader>
                        <DialogTitle className="text-xl">إتمام عملية الدفع</DialogTitle>
                         <DialogDescriptionComponent>اختر العميل (للبيع الآجل) وطريقة الدفع.</DialogDescriptionComponent>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="text-center">
                            <p className="text-muted-foreground">المبلغ الإجمالي للدفع</p>
                            <p className="text-3xl font-bold text-primary" dangerouslySetInnerHTML={{ __html: formatCurrency(totalAmount).amount + ' ' + formatCurrency(totalAmount).symbol }}></p>
                        </div>
                        <div>
                            <Label htmlFor="posCustomer">العميل</Label>
                            <Select dir="rtl" value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                                <SelectTrigger id="posCustomer" className="bg-background">
                                    <SelectValue placeholder="اختر العميل (ضروري للبيع الآجل)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={CASH_CUSTOMER_ID}><em>عميل نقدي (بدون اسم)</em></SelectItem>
                                    {customers.map(cust => (
                                        <SelectItem key={cust.id} value={cust.id}>{cust.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>طريقة الدفع</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')} className="flex-col h-auto py-2 text-sm">
                                    <CircleDollarSign className="h-5 w-5 mb-1"/> نقدي
                                </Button>
                                <Button variant={paymentMethod === 'card' ? 'default' : 'outline'} onClick={() => setPaymentMethod('card')} className="flex-col h-auto py-2 text-sm">
                                    <CreditCard className="h-5 w-5 mb-1"/> بطاقة
                                </Button>
                                 <Button variant={paymentMethod === 'bank' ? 'default' : 'outline'} onClick={() => setPaymentMethod('bank')} className="flex-col h-auto py-2 text-sm">
                                    <Landmark className="h-5 w-5 mb-1"/> تحويل
                                </Button>
                                <Button variant={paymentMethod === 'deferred' ? 'default' : 'outline'} onClick={() => setPaymentMethod('deferred')} className="flex-col h-auto py-2 text-sm" disabled={!selectedCustomerId || selectedCustomerId === CASH_CUSTOMER_ID}>
                                    <UserCheck className="h-5 w-5 mb-1"/> بيع آجل
                                </Button>
                            </div>
                        </div>
                        {paymentMethod === 'cash' && (
                             <div>
                                <Label htmlFor="paidAmount">المبلغ المدفوع</Label>
                                <Input id="paidAmount" type="number" placeholder="أدخل المبلغ المدفوع من العميل" className="bg-background" />
                                {/* Logic for change can be added here */}
                            </div>
                        )}
                      </div>
                      <DialogFooter className="sm:justify-start">
                        <Button type="button" className="w-full" onClick={handleProcessPayment} disabled={!paymentMethod || (paymentMethod === 'deferred' && (!selectedCustomerId || selectedCustomerId === CASH_CUSTOMER_ID))}>
                           <Printer className="me-2 h-4 w-4" /> تأكيد وطباعة الفاتورة
                        </Button>
                         <DialogClose asChild>
                            <Button type="button" variant="outline" className="w-full sm:w-auto">
                                إلغاء
                            </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </>
            )}
            
          </Card>
          <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-md flex items-center"><History className="me-2 h-4 w-4 text-primary"/> آخر العمليات في هذه الجلسة</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <ScrollArea className="h-24">
                    <Table size="sm">
                        <TableBody>
                            {recentTransactions.map(trx => (
                                <TableRow key={trx.id} className="text-xs">
                                    <TableCell className="p-1">{trx.time}</TableCell>
                                    <TableCell className="p-1">#{trx.id.slice(-3)} {trx.customerName && `(${trx.customerName.substring(0,10)}..)`}</TableCell>
                                    <TableCell className="p-1" dangerouslySetInnerHTML={{ __html: formatCurrency(trx.total).amount + ' ' + formatCurrency(trx.total).symbol }}></TableCell>
                                    <TableCell className="p-1">
                                        <Badge variant={trx.paymentMethod === 'آجل' ? 'destructive' : 'secondary'} className="text-xs">{trx.paymentMethod}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
