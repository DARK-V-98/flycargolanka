
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy, type Timestamp } from 'firebase/firestore';
import type { UserProfile, NicVerificationStatus } from '@/contexts/AuthContext';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BadgeCheck, User, Mail, Phone, Fingerprint, Book, AlertTriangle, Filter, Image as ImageIcon, Search } from 'lucide-react';
import { format } from 'date-fns';

interface BookingStub {
  id: string;
  createdAt: Timestamp;
}

interface UserForVerification extends UserProfile {
  bookings: BookingStub[];
}

type VerificationFilterStatus = 'all' | NicVerificationStatus;

const getStatusBadgeVariant = (status: NicVerificationStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'pending': return 'secondary';
    case 'verified': return 'default';
    case 'rejected': return 'destructive';
    case 'none':
    default:
      return 'outline';
  }
};

export default function VerifyNicPage() {
  const [allUsers, setAllUsers] = useState<UserForVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<VerificationFilterStatus>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [actioningUser, setActioningUser] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsersToVerify = useCallback(async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      // Fetch all users and filter client-side, as Firestore query limitations on '!=' and 'in' are restrictive.
      const userSnapshot = await getDocs(usersRef);

      const usersDataPromises = userSnapshot.docs
        .filter(doc => doc.data().nicVerificationStatus && doc.data().nicVerificationStatus !== 'none')
        .map(async (userDoc) => {
          const userData = userDoc.data() as UserProfile;
          const bookingsRef = collection(db, 'bookings');
          const bookingsQuery = query(bookingsRef, where('userId', '==', userData.uid), orderBy('createdAt', 'desc'));
          const bookingsSnapshot = await getDocs(bookingsQuery);
          const bookings = bookingsSnapshot.docs.map(doc => ({ id: doc.id, createdAt: doc.data().createdAt as Timestamp }));
          return { ...userData, bookings };
        });
      
      const usersData = await Promise.all(usersDataPromises);
      usersData.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));

      setAllUsers(usersData);
    } catch (error) {
      console.error("Error fetching users for verification:", error);
      toast({ title: "Error", description: "Could not fetch users for verification.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsersToVerify();
  }, [fetchUsersToVerify]);

  const filteredUsers = useMemo(() => {
    let currentUsers = [...allUsers];

    // Filter by status first
    if (filterStatus !== 'all') {
      currentUsers = currentUsers.filter(user => user.nicVerificationStatus === filterStatus);
    }

    // Then filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentUsers = currentUsers.filter(user =>
        (user.email && user.email.toLowerCase().includes(lowerSearchTerm)) ||
        (user.displayName && user.displayName.toLowerCase().includes(lowerSearchTerm)) ||
        (user.nic && user.nic.toLowerCase().includes(lowerSearchTerm)) ||
        user.bookings.some(booking => booking.id.toLowerCase().includes(lowerSearchTerm))
      );
    }

    return currentUsers;
  }, [allUsers, filterStatus, searchTerm]);


  const handleStatusUpdate = async (userId: string, newStatus: 'verified' | 'rejected') => {
    setActioningUser(userId);
    try {
      const userDocRef = doc(db, 'users', userId);
      await updateDoc(userDocRef, {
        nicVerificationStatus: newStatus,
        updatedAt: serverTimestamp(),
      });

      setAllUsers(prevUsers => prevUsers.map(u => u.uid === userId ? { ...u, nicVerificationStatus: newStatus } : u));
      toast({ title: "Success", description: `User status updated to ${newStatus}.`, variant: 'default' });

    } catch (error) {
      console.error(`Error updating user status to ${newStatus}:`, error);
      toast({ title: "Error", description: "Could not update user status.", variant: "destructive" });
    } finally {
      setActioningUser(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading verification requests...</div>;
  }

  return (
    <div className="space-y-6 opacity-0 animate-fadeInUp">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl sm:text-2xl font-headline text-accent">
            <BadgeCheck className="mr-2 sm:mr-3 h-6 sm:h-7 w-6 sm:w-7 text-primary" /> NIC Verification Requests
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Review and approve or reject user NIC submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
            <div className="relative w-full flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search Email, Name, NIC, Booking ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 h-10"
                />
            </div>
            <div className="w-full sm:w-auto flex-shrink-0">
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as VerificationFilterStatus)}>
                    <SelectTrigger className="w-full sm:w-[200px] h-10">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>

          {filteredUsers.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No users found for the selected filter.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredUsers.map(user => (
                <Card key={user.uid} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback>{user.displayName ? user.displayName.charAt(0).toUpperCase() : <User />}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{user.displayName}</CardTitle>
                        <CardDescription className="text-xs break-all">{user.email}</CardDescription>
                        <Badge variant={getStatusBadgeVariant(user.nicVerificationStatus as NicVerificationStatus)} className="mt-2 capitalize text-xs">
                          {user.nicVerificationStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm flex-grow">
                    <div className="flex items-center"><Fingerprint className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>NIC:</strong> <span className="ml-1">{user.nic || 'N/A'}</span></div>
                    <div className="flex items-center"><Phone className="mr-2 h-4 w-4 text-muted-foreground" /> <strong>Phone:</strong> <span className="ml-1">{user.phone || 'N/A'}</span></div>
                    
                    <div className="space-y-2 pt-2">
                        <h4 className="font-semibold flex items-center text-sm"><ImageIcon className="mr-2 h-4 w-4 text-muted-foreground"/> Submitted Images</h4>
                        <div className="flex gap-4">
                            {user.nicFrontUrl ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="border rounded-md p-1 hover:border-primary transition-colors"><Image src={user.nicFrontUrl} alt="NIC Front" width={120} height={75} className="rounded-sm object-contain" /></button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>NIC Front Image</DialogTitle></DialogHeader><Image src={user.nicFrontUrl} alt="NIC Front" width={800} height={500} className="w-full h-auto rounded-md mt-4"/></DialogContent>
                                </Dialog>
                            ) : <p className="text-xs text-muted-foreground">Front image not submitted.</p>}
                            {user.nicBackUrl ? (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="border rounded-md p-1 hover:border-primary transition-colors"><Image src={user.nicBackUrl} alt="NIC Back" width={120} height={75} className="rounded-sm object-contain" /></button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xl"><DialogHeader><DialogTitle>NIC Back Image</DialogTitle></DialogHeader><Image src={user.nicBackUrl} alt="NIC Back" width={800} height={500} className="w-full h-auto rounded-md mt-4"/></DialogContent>
                                </Dialog>
                            ) : <p className="text-xs text-muted-foreground">Back image not submitted.</p>}
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h4 className="font-semibold flex items-center text-sm"><Book className="mr-2 h-4 w-4 text-muted-foreground"/> Bookings ({user.bookings.length})</h4>
                      {user.bookings.length > 0 ? (
                        <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
                          {user.bookings.map(b => (
                            <p key={b.id} className="font-mono text-muted-foreground">{b.id} - <span className="italic">{format(b.createdAt.toDate(), 'PP')}</span></p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">No bookings found for this user.</p>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2 mt-auto">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={actioningUser === user.uid || user.nicVerificationStatus === 'rejected'}>
                          {actioningUser === user.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Reject'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirm Rejection</AlertDialogTitle><AlertDialogDescription>Are you sure you want to reject NIC verification for {user.email}? The user will be notified to re-submit.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleStatusUpdate(user.uid, 'rejected')} className={buttonVariants({ variant: 'destructive' })}>Confirm Reject</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="default" size="sm" disabled={actioningUser === user.uid || user.nicVerificationStatus === 'verified'}>
                          {actioningUser === user.uid ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Approve'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirm Approval</AlertDialogTitle><AlertDialogDescription>Are you sure you want to approve NIC verification for {user.email}?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleStatusUpdate(user.uid, 'verified')}>Confirm Approve</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
