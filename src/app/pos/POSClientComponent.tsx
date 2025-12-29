
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription as DialogDescriptionComponent } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Search, PlusCircle, MinusCircle, Trash2, Printer, UserPlus, Percent, ScanLine, History, X, CreditCard, Landmark, CircleDollarSign, UploadCloud, UserCheck, CreditCardIcon } from "lucide-react";
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast"; 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; 
import type { Invoice as SalesInvoice } from '@/app/sales/SalesClientComponent';
import type { JournalEntry as GLJournalEntry } from '@/app/general-ledger/GeneralLedgerClientComponent'; 
import { useCurrency } from '@/hooks/use-currency';

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
}

interface RecentTransaction {
  id: string;
  time: string;
  items: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
}

const initialRecentTransactions: RecentTransaction[] = [
    { id: "TRX001", time: "10:30 ص", items: 2, total: 30, paymentMethod: "نقدي" },
    { id: "TRX002", time: "10:35 ص", items: 1, total: 15, paymentMethod: "بطاقة" },
    { id: "TRX003", time: "10:42 ص", items: 3, total: 45, paymentMethod: "نقدي" },
];


interface POSClientComponentProps {
  initialData: {
    products: Product[];
    categories: string[];
    customers: Customer[];
  };
}

export default function POSClientComponent({ initialData }: POSClientComponentProps) {
  const [products, setProducts] = useState(initialData.products);
  const [categories, setCategories] = useState(initialData.categories);
  const [customers, setCustomers] = useState(initialData.customers);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(CASH_CUSTOMER_ID); 
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const { toast } = useToast();
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>(initialRecentTransactions);
  const { formatCurrency } = useCurrency();


  useEffect(() => {
    setProducts(initialData.products);
    setCategories(initialData.categories);
    setCustomers(initialData.customers);
  }, [initialData]);
  
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(subtotal - discount);
  }, [cart, discount]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
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

  const handleProcessPayment = () => {
    const transactionId = `TRX${Date.now().toString().slice(-5)}`;
    const customer = customers.find(c => c.id === selectedCustomerId);
    const customerNameForInvoice = selectedCustomerId === CASH_CUSTOMER_ID ? 'عميل نقدي' : (customer?.name || 'عميل غير محدد');

    if (paymentMethod === 'deferred') {
        if (!selectedCustomerId || selectedCustomerId === CASH_CUSTOMER_ID) {
            toast({
                title: "خطأ",
                description: "الرجاء اختيار عميل معرف لعملية البيع الآجل.",
                variant: "destructive",
            });
            return;
        }
        
        const deferredInvoice: SalesInvoice = {
            id: `INV-POS-${transactionId}`,
            customerId: selectedCustomerId,
            date: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days later
            items: cart.map(item => ({ 
                itemId: item.id, 
                description: item.name, 
                quantity: item.quantity, 
                unitPrice: item.price, 
                total: item.price * item.quantity 
            })), 
            numericTotalAmount: totalAmount,
            status: "غير مدفوع",
            isDeferredPayment: true,
            notes: `فاتورة آجلة من نقطة البيع للعميل: ${customerNameForInvoice}`,
            source: "POS",
        };
        
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('addExternalSalesInvoice', { detail: deferredInvoice });
            window.dispatchEvent(event);
        }

        toast({
            title: "تم تسجيل البيع الآجل بنجاح!",
            description: `تم إنشاء فاتورة آجلة رقم ${deferredInvoice.id} للعميل ${customerNameForInvoice}.`,
            variant: "default",
        });

    } else {
        // Standard payment processing
        const settledInvoice: SalesInvoice = {
            id: `INV-POS-${transactionId}`,
            customerId: selectedCustomerId || CASH_CUSTOMER_ID,
            date: new Date(),
            dueDate: new Date(), // Due immediately for cash/card
            items: cart.map(item => ({ 
                itemId: item.id, 
                description: item.name, 
                quantity: item.quantity, 
                unitPrice: item.price, 
                total: item.price * item.quantity 
            })),
            numericTotalAmount: totalAmount,
            status: "مدفوع",
            isDeferredPayment: false,
            notes: `فاتورة من نقطة البيع للعميل: ${customerNameForInvoice} - طريقة الدفع: ${paymentMethod}`,
            source: "POS",
        };
        
        if (typeof window !== 'undefined') {
            const event = new CustomEvent('addExternalSalesInvoice', { detail: settledInvoice });
            window.dispatchEvent(event);
        }

        toast({
            title: "تمت عملية الدفع بنجاح!",
            description: `تم إنشاء الفاتورة رقم ${settledInvoice.id} والمبلغ ${totalAmount.toFixed(2)} SAR.`,
            variant: "default",
        });
    }
    
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
  };

  const handlePostToGL = () => {
    const settledSalesTotal = recentTransactions
        .filter(trx => trx.paymentMethod === "نقدي" || trx.paymentMethod === "بطاقة" || trx.paymentMethod === "تحويل")
        .reduce((sum, trx) => sum + trx.total, 0);

    if (settledSalesTotal <= 0) {
        toast({
            title: "لا يوجد رصيد مبيعات (نقدية/بطاقة/تحويل) للترحيل",
            description: "لم يتم تسجيل أي مبيعات نقدية أو بالبطاقة أو تحويل مؤخراً.",
            variant: "destructive"
        });
        return;
    }
    
    const journalEntryData: GLJournalEntry = {
        id: `POS_JV_${Date.now().toString().slice(-5)}`,
        date: new Date(),
        description: `ترحيل إجمالي مبيعات نقاط البيع (نقدية/بطاقة/تحويل) - ${new Date().toLocaleDateString('ar-SA')}`,
        lines: [
            { accountId: "1013", debit: settledSalesTotal, credit: 0, description: "إجمالي مبيعات نقاط البيع (نقدية/بطاقة/تحويل)" }, 
            { accountId: "4010", debit: 0, credit: settledSalesTotal, description: "إيراد مبيعات نقاط البيع" }, 
        ],
        totalAmount: settledSalesTotal,
        status: "مرحل",
        sourceModule: "POS",
        sourceDocumentId: `POS_SETTLED_${Date.now().toString().slice(-5)}`
    };
    
    if (typeof window !== 'undefined') {
       const event = new CustomEvent('addExternalJournalEntry', { detail: journalEntryData });
       window.dispatchEvent(event);
    }

    toast({
        title: "تم طلب ترحيل المبيعات المسددة",
        description: `سيتم ترحيل قيد إجمالي المبيعات النقدية/بالبطاقة/تحويل بمبلغ ${settledSalesTotal.toFixed(2)} SAR.`,
        variant: "default",
    });
  };


  return (
    <div className="container mx-auto py-6 h-[calc(100vh-theme(spacing.24))] flex flex-col" dir="rtl">
      <Card className="shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <CreditCardIcon className="me-2 h-8 w-8 text-primary" /> 
            نقطة البيع (POS)
          </CardTitle>
          <CardDescription>إدارة عمليات البيع بالتجزئة، طباعة الإيصالات، وتتبع المبيعات.</CardDescription>
        </CardHeader>
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
                    className="cursor-pointer hover:shadow-xl transition-shadow duration-200 flex flex-col items-center text-center overflow-hidden"
                    onClick={() => addToCart(product)}
                  >
                    <div className="relative w-full h-32 sm:h-36 md:h-40">
                        <Image src={product.image || 'https://picsum.photos/200/200'} alt={product.name} layout="fill" objectFit="cover" data-ai-hint={product.dataAiHint || 'product'} />
                    </div>
                    <CardHeader className="p-2 w-full">
                      <CardTitle className="text-sm font-semibold truncate">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 w-full">
                      <p className="text-primary font-bold text-sm" dangerouslySetInnerHTML={{ __html: formatCurrency(product.price) }}></p>
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
                      <Image src={item.image || 'https://picsum.photos/200/200'} alt={item.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={products.find(p=>p.id===item.id)?.dataAiHint || 'product'}/>
                      <div className="flex-grow">
                        <p className="font-semibold truncate text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground" dangerouslySetInnerHTML={{ __html: formatCurrency(item.price) }}></p>
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
                    <span className="font-semibold" dangerouslySetInnerHTML={{ __html: formatCurrency(subtotal) }}></span>
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
                    <span dangerouslySetInnerHTML={{ __html: formatCurrency(totalAmount) }}></span>
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
                            <p className="text-3xl font-bold text-primary" dangerouslySetInnerHTML={{ __html: formatCurrency(totalAmount) }}></p>
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
             <Separator />
              <CardContent className="p-4">
                 <Button variant="secondary" className="w-full shadow-sm" onClick={handlePostToGL} disabled={recentTransactions.filter(trx => trx.paymentMethod !== "آجل").length === 0 /* Disable if no settled transactions to post*/}>
                    <UploadCloud className="me-2 h-4 w-4" /> ترحيل إجمالي المبيعات للقيود
                  </Button>
              </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-md flex items-center"><History className="me-2 h-4 w-4 text-primary"/> آخر العمليات</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <ScrollArea className="h-24">
                    <Table size="sm">
                        <TableBody>
                            {recentTransactions.map(trx => (
                                <TableRow key={trx.id} className="text-xs">
                                    <TableCell className="p-1">{trx.time}</TableCell>
                                    <TableCell className="p-1">#{trx.id.slice(-3)} {trx.customerName && `(${trx.customerName.substring(0,10)}..)`}</TableCell>
                                    <TableCell className="p-1" dangerouslySetInnerHTML={{ __html: formatCurrency(trx.total) }}></TableCell>
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
