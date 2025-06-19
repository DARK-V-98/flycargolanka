
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, type Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, CalendarDays } from "lucide-react";
import { format } from 'date-fns';

interface Booking {
  id: string;
  senderName: string;
  receiverName: string;
  serviceType: string;
  status: 'Pending' | 'In Transit' | 'Delivered' | 'Cancelled';
  createdAt: Timestamp;
  // Add other fields from bookingSchema as needed for display
  packageDescription: string;
  packageWeight: number;
}

export default function AdminOrdersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const bookingsCol = collection(db, 'bookings');
        const q = query(bookingsCol, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const bookingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Booking));
        setBookings(bookingsData);
      } catch (error) {
        console.error("Error fetching bookings: ", error);
        // Optionally, set an error state and display an error message
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusVariant = (status: Booking['status']) => {
    switch (status) {
      case 'Pending':
        return 'secondary';
      case 'In Transit':
        return 'default';
      case 'Delivered':
        return 'outline'; // Success variant can be added to Badge component
      case 'Cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><p>Loading orders...</p></div>;
  }

  return (
    <div className="opacity-0 animate-fadeInUp">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <Package className="mr-3 h-7 w-7 text-primary" /> All Customer Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sender</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Weight (kg)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Booked On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{booking.senderName}</TableCell>
                    <TableCell>{booking.receiverName}</TableCell>
                    <TableCell className="capitalize">{booking.serviceType.replace('_', ' ')}</TableCell>
                    <TableCell className="truncate max-w-xs">{booking.packageDescription}</TableCell>
                    <TableCell className="text-center">{booking.packageWeight}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {booking.createdAt ? format(booking.createdAt.toDate(), 'PPp') : 'N/A'}
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
