
"use client";

import { useEffect, useState, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, type Timestamp, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, CalendarDays, Save, Loader2, AlertTriangle, Search, Filter } from "lucide-react";
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
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [selectedStatusMap, setSelectedStatusMap] = useState<Record<string, BookingStatus>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<BookingStatus | 'All'>('All');

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
        setAllBookings(bookingsData);
        
        const initialStatuses: Record<string, BookingStatus> = {};
        bookingsData.forEach(b => {
            initialStatuses[b.id] = b.status;
        });
        setSelectedStatusMap(initialStatuses);

      } catch (error) {
        console.error("Error fetching bookings: ", error);
        toast({ title: "Error", description: "Could not fetch bookings.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [toast]);

  useEffect(() => {
    let currentBookings = [...allBookings];

    if (filterStatus !== 'All') {
      currentBookings = currentBookings.filter(booking => booking.status === filterStatus);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentBookings = currentBookings.filter(booking =>
        booking.id.toLowerCase().includes(lowerSearchTerm) ||
        booking.senderName.toLowerCase().includes(lowerSearchTerm) ||
        booking.receiverName.toLowerCase().includes(lowerSearchTerm) ||
        (booking.userEmail && booking.userEmail.toLowerCase().includes(lowerSearchTerm))
      );
    }
    setFilteredBookings(currentBookings);
  }, [allBookings, searchTerm, filterStatus]);


  const getStatusVariant = (status: BookingStatus) => {
    switch (status) {
      case 'Pending': return 'secondary';
      case 'Confirmed': return 'default'; 
      case 'In Transit': return 'default'; // Using 'default' (primary color) for visual distinction
      case 'Delivered': return 'outline'; // Using 'outline' as it's less prominent than success, implying completion
      case 'Cancelled': return 'destructive';
      case 'Rejected': return 'destructive';
      case 'Paused': return 'secondary'; // Using secondary, similar to pending but distinct
      default: return 'secondary';
    }
  };

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    setSelectedStatusMap(prev => ({ ...prev, [bookingId]: newStatus }));
  };

  const handleSaveStatus = async (bookingId: string) => {
    const newStatus = selectedStatusMap[bookingId];
    if (!newStatus) return;

    setUpdatingStatus(prev => ({ ...prev, [bookingId]: true }));
    try {
      const bookingDocRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingDocRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      // Update allBookings so filters re-apply correctly
      setAllBookings(prevAllBookings =>
        prevAllBookings.map(b =>
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


  if (loading && allBookings.length === 0) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading orders...</div>;
  }

  return (
    <div className="opacity-0 animate-fadeInUp">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl sm:text-2xl font-headline text-accent">
            <Package className="mr-2 sm:mr-3 h-6 sm:h-7 w-6 sm:w-7 text-primary" /> All Customer Orders
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Manage and view all customer bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search ID, Name, Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 text-sm h-9 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as BookingStatus | 'All')}>
                <SelectTrigger className="w-full sm:w-[160px] text-sm h-9">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All" className="text-xs sm:text-sm">All Statuses</SelectItem>
                    {ALL_STATUSES.map(s => (
                    <SelectItem key={s} value={s} className="capitalize text-xs sm:text-sm">
                        {s}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
          </div>

          {loading && allBookings.length > 0 ? (
             <div className="flex justify-center items-center py-6 sm:py-8"><Loader2 className="h-5 sm:h-6 w-5 sm:h-6 animate-spin text-primary mr-2" /> <span className="text-sm">Refreshing data...</span></div>
          ) : filteredBookings.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-6 sm:py-8">
              {allBookings.length > 0 ? "No orders match your current filters." : "No orders found."}
            </p>
          ) : (
            <div className="overflow-x-auto">
            <Table className="min-w-[900px]"><TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] px-2 py-2 text-xs sm:text-sm">ID</TableHead>
                  <TableHead className="px-2 py-2 text-xs sm:text-sm">Sender</TableHead>
                  <TableHead className="px-2 py-2 text-xs sm:text-sm">Receiver</TableHead>
                  <TableHead className="px-2 py-2 text-xs sm:text-sm">Service</TableHead>
                  <TableHead className="text-center px-1 py-2 text-xs sm:text-sm">Weight (kg)</TableHead>
                  <TableHead className="text-center px-1 py-2 text-xs sm:text-sm">Cost (LKR)</TableHead>
                  <TableHead className="text-center px-2 py-2 text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-right min-w-[140px] px-2 py-2 text-xs sm:text-sm">Booked On</TableHead>
                  <TableHead className="text-center min-w-[210px] px-2 py-2 text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs truncate max-w-[100px] sm:max-w-[120px] px-2 py-2.5">
                        {booking.id}
                    </TableCell>
                    <TableCell className="font-medium text-xs sm:text-sm px-2 py-2.5">{booking.senderName}</TableCell>
                    <TableCell className="text-xs sm:text-sm px-2 py-2.5">{booking.receiverName}</TableCell>
                    <TableCell className="capitalize text-xs sm:text-sm px-2 py-2.5">{booking.serviceType.replace('_', ' ')}</TableCell>
                    <TableCell className="text-center text-xs sm:text-sm px-1 py-2.5">{booking.packageWeight}</TableCell>
                    <TableCell className="text-center text-xs sm:text-sm px-1 py-2.5">
                      {booking.estimatedCostLKR !== null && booking.estimatedCostLKR !== undefined ? booking.estimatedCostLKR.toLocaleString() : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center px-2 py-2.5">
                      <Badge variant={getStatusVariant(booking.status)} className="text-xs whitespace-nowrap">{booking.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs sm:text-sm px-2 py-2.5">
                      {booking.createdAt ? format(booking.createdAt.toDate(), 'PPp') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-center px-2 py-2.5">
                       <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                        <Select
                            value={selectedStatusMap[booking.id] || booking.status}
                            onValueChange={(value) => handleStatusChange(booking.id, value as BookingStatus)}
                            disabled={updatingStatus[booking.id]}
                        >
                            <SelectTrigger className="h-8 text-xs w-auto min-w-[100px] sm:min-w-[110px] flex-grow-0">
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
                            disabled={updatingStatus[booking.id] || selectedStatusMap[booking.id] === booking.status}
                            className="h-8 text-xs px-2 sm:px-3"
                        >
                            {updatingStatus[booking.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                            <Save className="h-3.5 w-3.5" />
                            )}
                        </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

