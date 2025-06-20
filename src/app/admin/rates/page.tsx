
"use client";

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc, writeBatch, getDoc } from 'firebase/firestore';
import type { CountryRate } from '@/types/shippingRates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Trash2, PlusCircle, ListOrdered, Globe, Loader2, Edit3, Settings2, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const addCountrySchema = z.object({
  name: z.string().min(2, "Country name must be at least 2 characters.").max(50, "Country name too long."),
});
type AddCountryFormValues = z.infer<typeof addCountrySchema>;

// Placeholder for WeightRate related schemas and functions - will be expanded
// const weightRateSchema = ...
// type WeightRateFormValues = ...

export default function ManageRatesPage() {
  const [countries, setCountries] = useState<CountryRate[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [isSubmittingCountry, setIsSubmittingCountry] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<CountryRate | null>(null);
  const [isDeletingCountry, setIsDeletingCountry] = useState(false);

  const { toast } = useToast();

  const countryForm = useForm<AddCountryFormValues>({
    resolver: zodResolver(addCountrySchema),
    defaultValues: { name: '' },
  });

  const fetchCountries = async () => {
    setLoadingCountries(true);
    try {
      const ratesCol = collection(db, 'shipping_rates');
      const q = query(ratesCol, orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const fetchedCountries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CountryRate));
      setCountries(fetchedCountries);
    } catch (error) {
      console.error("Error fetching countries:", error);
      toast({ title: "Error", description: "Could not fetch countries.", variant: "destructive" });
    } finally {
      setLoadingCountries(false);
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const onAddCountrySubmit: SubmitHandler<AddCountryFormValues> = async (data) => {
    setIsSubmittingCountry(true);
    try {
      // Check if country name already exists (case-insensitive)
      const existingCountry = countries.find(c => c.name.toLowerCase() === data.name.toLowerCase());
      if (existingCountry) {
        toast({ title: "Duplicate Country", description: "This country name already exists.", variant: "destructive" });
        setIsSubmittingCountry(false);
        return;
      }

      await addDoc(collection(db, 'shipping_rates'), {
        name: data.name,
        createdAt: serverTimestamp(),
        // Add a default empty weights subcollection if needed, or handle on first weight add
      });
      toast({ title: "Success", description: `${data.name} added successfully. You can now manage its weight rates.`, variant: "default" });
      countryForm.reset();
      fetchCountries(); // Refresh list
    } catch (error) {
      console.error("Error adding country:", error);
      toast({ title: "Error", description: "Could not add country.", variant: "destructive" });
    } finally {
      setIsSubmittingCountry(false);
    }
  };
  
  const handleDeleteCountry = async () => {
    if (!countryToDelete) return;
    setIsDeletingCountry(true);
    try {
      // First, delete all weight entries in the 'weights' subcollection
      const weightsSubcollectionRef = collection(db, 'shipping_rates', countryToDelete.id, 'weights');
      const weightsSnapshot = await getDocs(weightsSubcollectionRef);
      
      if (!weightsSnapshot.empty) {
        const batch = writeBatch(db);
        weightsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
      
      // Then, delete the country document itself
      await deleteDoc(doc(db, 'shipping_rates', countryToDelete.id));
      
      toast({ title: "Success", description: `${countryToDelete.name} and its associated weights deleted.`, variant: "default" });
      setCountries(countries.filter(c => c.id !== countryToDelete.id));
      setCountryToDelete(null);
    } catch (error) {
      console.error("Error deleting country:", error);
      toast({ title: "Error", description: `Could not delete ${countryToDelete.name}.`, variant: "destructive" });
    } finally {
      setIsDeletingCountry(false);
    }
  };


  return (
    <div className="space-y-6 opacity-0 animate-fadeInUp">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <Settings2 className="mr-3 h-7 w-7 text-primary" /> Manage Shipping Rates
          </CardTitle>
          <CardDescription>Add countries and then manage their specific shipping weight rates and prices.</CardDescription>
        </CardHeader>
      </Card>

      {/* Add Country Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline text-accent">
            <Globe className="mr-2 h-5 w-5 text-primary" /> Add New Country
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...countryForm}>
            <form onSubmit={countryForm.handleSubmit(onAddCountrySubmit)} className="flex flex-col sm:flex-row gap-4 items-start">
              <FormField
                control={countryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel className="sr-only">Country Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter country name (e.g., Sri Lanka)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isSubmittingCountry} className="w-full sm:w-auto">
                {isSubmittingCountry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                Add Country
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* List Countries Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline text-accent">
            <ListOrdered className="mr-2 h-5 w-5 text-primary" /> Configured Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCountries ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2">Loading countries...</p>
            </div>
          ) : countries.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No countries added yet. Add one above to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country Name</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map((country) => (
                  <TableRow key={country.id}>
                    <TableCell className="font-medium">{country.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                       <Button variant="outline" size="sm" onClick={() => toast({ title: "Manage Weights", description: `Configuration for ${country.name} weights & prices will be implemented here.`, duration: 3000 })} className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700">
                         <Edit3 className="mr-1 h-4 w-4"/> Manage Weights & Prices
                       </Button>
                       <Dialog open={!!countryToDelete && countryToDelete.id === country.id} onOpenChange={(isOpen) => !isOpen && setCountryToDelete(null)}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setCountryToDelete(country)}>
                              <Trash2 className="mr-1 h-4 w-4" /> Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Deletion</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete <strong>{countryToDelete?.name}</strong>? This will also delete all its associated weight rates. This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button variant="outline" onClick={() => setCountryToDelete(null)}>Cancel</Button>
                              </DialogClose>
                              <Button variant="destructive" onClick={handleDeleteCountry} disabled={isDeletingCountry}>
                                {isDeletingCountry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Delete Country
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for managing weights of a selected country - This will be the next major implementation step */}
      {/* For example, clicking "Manage Weights & Prices" above could open a modal or navigate to a new sub-view for that country. */}

    </div>
  );
}

    