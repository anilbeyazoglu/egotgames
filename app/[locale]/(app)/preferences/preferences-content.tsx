"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: Timestamp;
  status: 'completed' | 'pending' | 'failed';
}

export function PreferencesContent() {
  const t = useTranslations('Preferences');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchTransactions(currentUser.uid);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTransactions = async (userId: string) => {
    setLoadingTransactions(true);
    try {
      // Assuming a subcollection 'transactions' for now
      const q = query(
        collection(db, `users/${userId}/transactions`),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(q);
      const data: Transaction[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
      setLoadingTransactions(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div>{t('pleaseLogin')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('creditHistory')}</CardTitle>
          <CardDescription>{t('creditHistoryDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
             <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {t('noTransactions')}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('descriptionLabel')}</TableHead>
                  <TableHead>{t('statusLabel')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {tx.createdAt ? format(tx.createdAt.toDate(), 'PP p') : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                            {tx.type === 'credit' ? (
                                <ArrowDownLeft className="h-4 w-4 text-green-500" />
                            ) : (
                                <ArrowUpRight className="h-4 w-4 text-red-500" />
                            )}
                            {tx.description}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'default' : tx.status === 'pending' ? 'secondary' : 'destructive'}>
                            {t(`status.${tx.status}`)}
                        </Badge>
                    </TableCell>
                    <TableCell className={`text-right ${tx.type === 'credit' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'credit' ? '+' : '-'}{tx.amount}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
