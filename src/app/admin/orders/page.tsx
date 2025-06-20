
"use client";

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, type Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, CalendarDays, Save, Loader2, AlertTriangle } from "lucide-react";
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export type BookingStatus = 'Pending' | 'Confirmed' | 'In Transit' | 'Delivered' | 'Cancelled' | 'Rejected' | 'Paused';

interface Booking {
  id: string;
  senderName: string;
  receiverName: string;
  serviceType: string;
  status: BookingStatus;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  packageDescription: string;
  packageWeight: number;
  estimatedCostLKR?: number | null;
  userId: string;
  userEmail: string | null;
}

const ALL_STATUSES: BookingStatus[] = ['Pending', 'Confirmed', 'In Transit', 'Delivered', 'Cancelled', 'Rejected', 'Paused'];

export default function AdminOrdersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [selectedStatus, setSelectedStatus] = useState<Record<string, BookingStatus>>({});

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const bookingsCol = collection(db, 'bookings');
        const q = query(bookingsCol, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const bookingsData = querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as Booking));
        setBookings(bookingsData);
        // Initialize selectedStatus with current statuses
        const initialStatuses: Record<string, BookingStatus> = {};
        bookingsData.forEach(b => {
            initialStatuses[b.id] = b.status;
        });
        setSelectedStatus(initialStatuses);

      } catch (error) {
        console.error("Error fetching bookings: ", error);
        toast({ title: "Error", description: "Could not fetch bookings.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [toast]);

  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Confirmed': return 'default'; // Using 'default' (primary theme color)
      case 'In Transit': return 'default';
      case 'Delivered': return 'outline'; // Typically success/greenish
      case 'Cancelled': return 'destructive';
      case 'Rejected': return 'destructive';
      case 'Paused': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    setSelectedStatus(prev => ({ ...prev, [bookingId]: newStatus }));
  };

  const handleSaveStatus = async (bookingId: string) => {
    const newStatus = selectedStatus[bookingId];
    if (!newStatus) return;

    setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
    try {
      const bookingDocRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setBookings(prevBookings =>
        prevBookings.map(b =>
          b.id === bookingId ? { ...b, status: newStatus, updatedAt: { seconds: Date.now()/1000, nanoseconds: 0 } as unknown as Timestamp } : b
        )
      );
      toast({
        title: "Status Updated",
        description: `Booking ${bookingId} status changed to ${newStatus}.`,
        variant: "default"
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Update Failed",
        description: `Could not update status for booking ${bookingId}.`,
        variant: "destructive",
        action: <AlertTriangle className="text-yellow-500" />
      });
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [bookingId]: false }));
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
                  <TableHead className="min-w-[120px]">ID</TableHead>
                  <TableHead>Sender</TableHead>
                  <TableHead>Receiver</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-center">Weight (kg)</TableHead>
                  <TableHead className="text-center">Cost (LKR)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Booked On</TableHead>
                  <TableHead className="text-center min-w-[200px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs truncate max-w-[120px]">{booking.id}</TableCell>
                    <TableCell className="font-medium">{booking.senderName}</TableCell>
                    <TableCell>{booking.receiverName}</TableCell>
                    <TableCell className="capitalize">{booking.serviceType.replace('_', ' ')}</TableCell>
                    <TableCell className="text-center">{booking.packageWeight}</TableCell>
                    <TableCell className="text-center">
                      {booking.estimatedCostLKR !== null && booking.estimatedCostLKR !== undefined ? booking.estimatedCostLKR.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {booking.createdAt ? format(booking.createdAt.toDate(), 'PPp') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center space-x-2">
                       <Select
                        value={selectedStatus[booking.id] || booking.status}
                        onValueChange={(value) => handleStatusChange(booking.id, value as BookingStatus)}
                        disabled={updatingStatus[booking.id]}
                      >
                        <SelectTrigger className="h-9 text-xs w-auto min-w-[120px] inline-flex">
                          <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATUSES.map(s => (
                            <SelectItem key={s} value={s} className="capitalize text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => handleSaveStatus(booking.id)}
                        disabled={updatingStatus[booking.id] || selectedStatus[booking.id] === booking.status}
                        className="h-9 text-xs"
                      >
                        {updatingStatus[booking.id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
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
