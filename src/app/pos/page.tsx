
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DollarSign, ShoppingCart, Search, PlusCircle, MinusCircle, Trash2, Printer, UserPlus, Percent, ScanLine, History, X, CreditCard, Landmark, CircleDollarSign } from "lucide-react";
import Image from 'next/image';

// Mock data
const categories = ["الكل", "مشروبات", "مأكولات خفيفة", "حلويات", "مخبوزات", "منتجات ورقية"];
const products = [
  { id: "PROD001", name: "قهوة سوداء", category: "مشروبات", price: 10, stock: 50, image: "https://picsum.photos/200/200?random=1", dataAiHint: "coffee drink" },
  { id: "PROD002", name: "شاي أحمر", category: "مشروبات", price: 8, stock: 100, image: "https://picsum.photos/200/200?random=2", dataAiHint: "tea drink" },
  { id: "PROD003", name: "كرواسون بالجبنة", category: "مخبوزات", price: 12, stock: 30, image: "https://picsum.photos/200/200?random=3", dataAiHint: "croissant pastry" },
  { id: "PROD004", name: "كيكة شوكولاتة", category: "حلويات", price: 15, stock: 20, image: "https://picsum.photos/200/200?random=4", dataAiHint: "chocolate cake" },
  { id: "PROD005", name: "ماء معدني", category: "مشروبات", price: 2, stock: 200, image: "https://picsum.photos/200/200?random=5", dataAiHint: "water bottle" },
  { id: "PROD006", name: "شيبس ملح", category: "مأكولات خفيفة", price: 5, stock: 80, image: "https://picsum.photos/200/200?random=6", dataAiHint: "potato chips" },
  { id: "PROD007", name: "عصير برتقال طازج", category: "مشروبات", price: 18, stock: 40, image: "https://picsum.photos/200/200?random=7", dataAiHint: "orange juice" },
  { id: "PROD008", name: "ساندويتش دجاج", category: "مأكولات خفيفة", price: 22, stock: 25, image: "https://picsum.photos/200/200?random=8", dataAiHint: "chicken sandwich" },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const recentTransactions = [
    { id: "TRX001", time: "10:30 ص", items: 2, total: "30 SAR", paymentMethod: "نقدي" },
    { id: "TRX002", time: "10:35 ص", items: 1, total: "15 SAR", paymentMethod: "بطاقة" },
    { id: "TRX003", time: "10:42 ص", items: 3, total: "45 SAR", paymentMethod: "نقدي" },
];


export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [totalAmount, setTotalAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setTotalAmount(subtotal - discount);
  }, [cart, discount]);

  const addToCart = (product: typeof products[0]) => {
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
    setCustomerName('');
    setPaymentMethod(null);
  };
  
  const filteredProducts = products.filter(product =>
    (selectedCategory === 'الكل' || product.category === selectedCategory) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="container mx-auto py-6 h-[calc(100vh-theme(spacing.24))] flex flex-col">
      <Card className="shadow-lg mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl md:text-3xl">
            <DollarSign className="ms-2 h-8 w-8 text-primary" />
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
                        <Image src={product.image} alt={product.name} layout="fill" objectFit="cover" data-ai-hint={product.dataAiHint} />
                    </div>
                    <CardHeader className="p-2 w-full">
                      <CardTitle className="text-sm font-semibold truncate">{product.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2 pt-0 w-full">
                      <p className="text-primary font-bold text-sm">{product.price} SAR</p>
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
              <CardTitle className="flex items-center"><ShoppingCart className="ms-2 h-5 w-5 text-primary" /> سلة المشتريات</CardTitle>
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
                      <Image src={item.image} alt={item.name} width={48} height={48} className="rounded-md object-cover" data-ai-hint={products.find(p=>p.id===item.id)?.dataAiHint}/>
                      <div className="flex-grow">
                        <p className="font-semibold truncate text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.price} SAR</p>
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
                    <span className="font-semibold">{subtotal.toFixed(2)} SAR</span>
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
                    <span>{totalAmount.toFixed(2)} SAR</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full shadow-md hover:shadow-lg transition-shadow text-base py-3 h-auto" disabled={cart.length === 0}>
                        <DollarSign className="ms-2 h-5 w-5" /> الدفع
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl">إتمام عملية الدفع</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="text-center">
                            <p className="text-muted-foreground">المبلغ الإجمالي للدفع</p>
                            <p className="text-3xl font-bold text-primary">{totalAmount.toFixed(2)} SAR</p>
                        </div>
                        <div>
                            <Label htmlFor="customerName">اسم العميل (اختياري)</Label>
                            <Input id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="أدخل اسم العميل" className="bg-background" />
                        </div>
                        <div>
                            <Label>طريقة الدفع</Label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} onClick={() => setPaymentMethod('cash')} className="flex-col h-auto py-2">
                                    <CircleDollarSign className="h-6 w-6 mb-1"/> نقدي
                                </Button>
                                <Button variant={paymentMethod === 'card' ? 'default' : 'outline'} onClick={() => setPaymentMethod('card')} className="flex-col h-auto py-2">
                                    <CreditCard className="h-6 w-6 mb-1"/> بطاقة
                                </Button>
                                 <Button variant={paymentMethod === 'bank' ? 'default' : 'outline'} onClick={() => setPaymentMethod('bank')} className="flex-col h-auto py-2">
                                    <Landmark className="h-6 w-6 mb-1"/> تحويل بنكي
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
                        <Button type="button" className="w-full" onClick={() => { /* Process payment logic here */ clearCart(); /* close dialog */ }} disabled={!paymentMethod}>
                           <Printer className="ms-2 h-4 w-4" /> تأكيد وطباعة الفاتورة
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
                <CardTitle className="text-md flex items-center"><History className="ms-2 h-4 w-4 text-primary"/> آخر العمليات</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
                <ScrollArea className="h-24">
                    <Table size="sm">
                        <TableBody>
                            {recentTransactions.map(trx => (
                                <TableRow key={trx.id} className="text-xs">
                                    <TableCell className="p-1">{trx.time}</TableCell>
                                    <TableCell className="p-1">#{trx.id.slice(-3)}</TableCell>
                                    <TableCell className="p-1">{trx.total}</TableCell>
                                    <TableCell className="p-1">
                                        <Badge variant="secondary" className="text-xs">{trx.paymentMethod}</Badge>
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

