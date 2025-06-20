
"use client";

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc, writeBatch, updateDoc, getDoc } from 'firebase/firestore';
import type { CountryRate, WeightRate } from '@/types/shippingRates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Trash2, PlusCircle, ListOrdered, Globe, Loader2, Edit3, Settings2, XCircle, Save, BookOpen } from 'lucide-react';
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

const weightRateSchema = z.object({
  id: z.string().optional(), // For editing existing entries
  weightLabel: z.string().min(1, "Weight label is required (e.g., '0.5 kg', '1-2 kg').").max(50,"Label too long."),
  weightValue: z.coerce.number().positive("Weight value must be a positive number (for sorting)."),
  economyPrice: z.coerce.number().nonnegative("Price must be 0 or positive.").optional().nullable(),
  expressPrice: z.coerce.number().nonnegative("Price must be 0 or positive.").optional().nullable(),
  isEconomyEnabled: z.boolean().default(true),
  isExpressEnabled: z.boolean().default(true),
});
type WeightRateFormValues = z.infer<typeof weightRateSchema>;


export default function ManageRatesPage() {
  const [countries, setCountries] = useState<CountryRate[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [isSubmittingCountry, setIsSubmittingCountry] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<CountryRate | null>(null);
  const [isDeletingCountry, setIsDeletingCountry] = useState(false);

  const [selectedCountryForWeights, setSelectedCountryForWeights] = useState<CountryRate | null>(null);
  const [isWeightsModalOpen, setIsWeightsModalOpen] = useState(false);
  const [currentWeights, setCurrentWeights] = useState<WeightRate[]>([]);
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [editingWeightRate, setEditingWeightRate] = useState<WeightRateFormValues | null>(null);
  const [isSubmittingWeight, setIsSubmittingWeight] = useState(false);
  const [weightRateToDelete, setWeightRateToDelete] = useState<WeightRate | null>(null);
  const [isDeletingWeight, setIsDeletingWeight] = useState(false);


  const { toast } = useToast();

  const countryForm = useForm<AddCountryFormValues>({
    resolver: zodResolver(addCountrySchema),
    defaultValues: { name: '' },
  });

  const weightRateForm = useForm<WeightRateFormValues>({
    resolver: zodResolver(weightRateSchema),
    defaultValues: {
      weightLabel: '',
      weightValue: undefined,
      economyPrice: null,
      expressPrice: null,
      isEconomyEnabled: true,
      isExpressEnabled: true,
    },
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
      const existingCountry = countries.find(c => c.name.toLowerCase() === data.name.toLowerCase());
      if (existingCountry) {
        toast({ title: "Duplicate Country", description: "This country name already exists.", variant: "destructive" });
        setIsSubmittingCountry(false);
        return;
      }
      await addDoc(collection(db, 'shipping_rates'), {
        name: data.name,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Success", description: `${data.name} added. Manage its weight rates.`, variant: "default" });
      countryForm.reset();
      fetchCountries(); 
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
      const weightsSubcollectionRef = collection(db, 'shipping_rates', countryToDelete.id, 'weights');
      const weightsSnapshot = await getDocs(weightsSubcollectionRef);
      const batch = writeBatch(db);
      weightsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(doc(db, 'shipping_rates', countryToDelete.id)); // Delete country doc
      await batch.commit();
      toast({ title: "Success", description: `${countryToDelete.name} and its weights deleted.`, variant: "default" });
      setCountries(countries.filter(c => c.id !== countryToDelete.id));
      setCountryToDelete(null);
    } catch (error) {
      console.error("Error deleting country:", error);
      toast({ title: "Error", description: `Could not delete ${countryToDelete.name}.`, variant: "destructive" });
    } finally {
      setIsDeletingCountry(false);
    }
  };

  const fetchWeightsForCountry = async (countryId: string) => {
    setLoadingWeights(true);
    setCurrentWeights([]);
    try {
      const weightsColRef = collection(db, 'shipping_rates', countryId, 'weights');
      const q = query(weightsColRef, orderBy('weightValue', 'asc'));
      const snapshot = await getDocs(q);
      const fetchedWeights = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as WeightRate));
      setCurrentWeights(fetchedWeights);
    } catch (error) {
      console.error("Error fetching weights for country:", error);
      toast({ title: "Error", description: "Could not fetch weight rates.", variant: "destructive" });
    } finally {
      setLoadingWeights(false);
    }
  };

  const handleManageWeightsClick = (country: CountryRate) => {
    setSelectedCountryForWeights(country);
    fetchWeightsForCountry(country.id);
    setEditingWeightRate(null); // Clear any previous edit state
    weightRateForm.reset({ // Reset form to defaults
        weightLabel: '',
        weightValue: undefined,
        economyPrice: null,
        expressPrice: null,
        isEconomyEnabled: true,
        isExpressEnabled: true,
    });
    setIsWeightsModalOpen(true);
  };

  const onAddEditWeightSubmit: SubmitHandler<WeightRateFormValues> = async (data) => {
    if (!selectedCountryForWeights) return;
    setIsSubmittingWeight(true);

    const dataToSave = {
        ...data,
        economyPrice: data.economyPrice === undefined || data.economyPrice === null || isNaN(data.economyPrice) ? null : Number(data.economyPrice),
        expressPrice: data.expressPrice === undefined || data.expressPrice === null || isNaN(data.expressPrice) ? null : Number(data.expressPrice),
        updatedAt: serverTimestamp(),
    };

    try {
      if (editingWeightRate && editingWeightRate.id) { // Editing existing
        const weightDocRef = doc(db, 'shipping_rates', selectedCountryForWeights.id, 'weights', editingWeightRate.id);
        await updateDoc(weightDocRef, dataToSave);
        toast({ title: "Success", description: "Weight rate updated.", variant: "default" });
      } else { // Adding new
        const weightsColRef = collection(db, 'shipping_rates', selectedCountryForWeights.id, 'weights');
        await addDoc(weightsColRef, { ...dataToSave, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "Weight rate added.", variant: "default" });
      }
      weightRateForm.reset({ weightLabel: '', weightValue: undefined, economyPrice: null, expressPrice: null, isEconomyEnabled: true, isExpressEnabled: true});
      setEditingWeightRate(null);
      fetchWeightsForCountry(selectedCountryForWeights.id); // Refresh list
    } catch (error) {
      console.error("Error saving weight rate:", error);
      toast({ title: "Error", description: "Could not save weight rate.", variant: "destructive" });
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  const handleEditWeightClick = (weightRate: WeightRate) => {
    setEditingWeightRate({
        id: weightRate.id,
        weightLabel: weightRate.weightLabel,
        weightValue: weightRate.weightValue,
        economyPrice: weightRate.economyPrice,
        expressPrice: weightRate.expressPrice,
        isEconomyEnabled: weightRate.isEconomyEnabled,
        isExpressEnabled: weightRate.isExpressEnabled,
    });
    weightRateForm.reset({ // Populate form with existing data
        weightLabel: weightRate.weightLabel,
        weightValue: weightRate.weightValue,
        economyPrice: weightRate.economyPrice,
        expressPrice: weightRate.expressPrice,
        isEconomyEnabled: weightRate.isEconomyEnabled,
        isExpressEnabled: weightRate.isExpressEnabled,
    });
  };
  
  const handleDeleteWeightRate = async () => {
    if (!selectedCountryForWeights || !weightRateToDelete) return;
    setIsDeletingWeight(true);
    try {
      await deleteDoc(doc(db, 'shipping_rates', selectedCountryForWeights.id, 'weights', weightRateToDelete.id));
      toast({ title: "Success", description: `Weight rate ${weightRateToDelete.weightLabel} deleted.`, variant: "default" });
      setCurrentWeights(currentWeights.filter(wr => wr.id !== weightRateToDelete.id));
      setWeightRateToDelete(null); // Close confirmation
    } catch (error) {
      console.error("Error deleting weight rate:", error);
      toast({ title: "Error", description: "Could not delete weight rate.", variant: "destructive" });
    } finally {
      setIsDeletingWeight(false);
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-headline text-accent">
            <ListOrdered className="mr-2 h-5 w-5 text-primary" /> Configured Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCountries ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" /> <p className="ml-2">Loading countries...</p>
            </div>
          ) : countries.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No countries added yet.</p>
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
                       <Button variant="outline" size="sm" onClick={() => handleManageWeightsClick(country)} className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700">
                         <BookOpen className="mr-1 h-4 w-4"/> Manage Weights & Prices
                       </Button>
                       <Dialog open={!!countryToDelete && countryToDelete.id === country.id} onOpenChange={(isOpen) => !isOpen && setCountryToDelete(null)}>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm" onClick={() => setCountryToDelete(country)}>
                              <Trash2 className="mr-1 h-4 w-4" /> Delete Country
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader> <DialogTitle>Confirm Delete Country</DialogTitle>
                              <DialogDescription>Are you sure you want to delete <strong>{countryToDelete?.name}</strong>? This also deletes all its weight rates. This is irreversible.</DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <DialogClose asChild><Button variant="outline" onClick={() => setCountryToDelete(null)}>Cancel</Button></DialogClose>
                              <Button variant="destructive" onClick={handleDeleteCountry} disabled={isDeletingCountry}>
                                {isDeletingCountry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete Country
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

      {/* Weights Management Modal */}
      <Dialog open={isWeightsModalOpen} onOpenChange={(isOpen) => {
          setIsWeightsModalOpen(isOpen);
          if (!isOpen) {
              setSelectedCountryForWeights(null);
              setCurrentWeights([]);
              setEditingWeightRate(null);
              weightRateForm.reset();
          }
      }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Manage Weights & Prices for {selectedCountryForWeights?.name}</DialogTitle>
            <DialogDescription>Add, edit, or delete weight rates for this country.</DialogDescription>
          </DialogHeader>
          
          <Form {...weightRateForm}>
            <form onSubmit={weightRateForm.handleSubmit(onAddEditWeightSubmit)} className="space-y-4 border p-4 rounded-md mt-4">
              <h3 className="text-lg font-medium mb-2">{editingWeightRate ? "Edit Weight Rate" : "Add New Weight Rate"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={weightRateForm.control} name="weightLabel" render={({ field }) => (
                  <FormItem> <FormLabel>Weight Label (e.g., 0.5 kg)</FormLabel> <FormControl><Input placeholder="e.g., 1 kg, 2-3 kg" {...field} /></FormControl> <FormMessage /> </FormItem>
                )} />
                <FormField control={weightRateForm.control} name="weightValue" render={({ field }) => (
                  <FormItem> <FormLabel>Weight Value (kg, for sorting)</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="e.g., 1 or 2.5" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl> <FormMessage /> </FormItem>
                )} />
                <FormField control={weightRateForm.control} name="economyPrice" render={({ field }) => (
                  <FormItem> <FormLabel>Economy Price (LKR)</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="Optional, e.g., 1500" {...field} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem>
                )} />
                <FormField control={weightRateForm.control} name="expressPrice" render={({ field }) => (
                  <FormItem> <FormLabel>Express Price (LKR)</FormLabel> <FormControl><Input type="number" step="0.01" placeholder="Optional, e.g., 2000" {...field} onChange={e => field.onChange(e.target.value === '' ? null : parseFloat(e.target.value))} value={field.value ?? ''} /></FormControl> <FormMessage /> </FormItem>
                )} />
              </div>
              <div className="flex items-center space-x-4">
                <FormField control={weightRateForm.control} name="isEconomyEnabled" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-1 md:col-span-2">
                        <div className="space-y-0.5 mr-4">
                        <FormLabel>Enable Economy</FormLabel>
                        <FormDescription>Allow this weight for economy shipping.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
                <FormField control={weightRateForm.control} name="isExpressEnabled" render={({ field }) => (
                     <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm col-span-1 md:col-span-2">
                        <div className="space-y-0.5 mr-4">
                        <FormLabel>Enable Express</FormLabel>
                        <FormDescription>Allow this weight for express shipping.</FormDescription>
                        </div>
                        <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                )} />
              </div>
              <div className="flex justify-end space-x-2">
                {editingWeightRate && <Button type="button" variant="outline" onClick={() => { setEditingWeightRate(null); weightRateForm.reset(); }}>Cancel Edit</Button>}
                <Button type="submit" disabled={isSubmittingWeight}>
                  {isSubmittingWeight ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {editingWeightRate ? "Update Rate" : "Add Rate"}
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6">
            <h4 className="text-md font-medium mb-2">Existing Weight Rates for {selectedCountryForWeights?.name}</h4>
            {loadingWeights ? (
              <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Loading rates...</p></div>
            ) : currentWeights.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No weight rates added for this country yet.</p>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Label</TableHead>
                      <TableHead className="text-center">Value (kg)</TableHead>
                      <TableHead className="text-center">Economy (LKR)</TableHead>
                      <TableHead className="text-center">Express (LKR)</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentWeights.map((wr) => (
                      <TableRow key={wr.id}>
                        <TableCell>{wr.weightLabel}</TableCell>
                        <TableCell className="text-center">{wr.weightValue}</TableCell>
                        <TableCell className="text-center">
                          {wr.isEconomyEnabled ? (wr.economyPrice !== null ? wr.economyPrice : <XCircle className="h-4 w-4 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Disabled</span>}
                        </TableCell>
                        <TableCell className="text-center">
                          {wr.isExpressEnabled ? (wr.expressPrice !== null ? wr.expressPrice : <XCircle className="h-4 w-4 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Disabled</span>}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEditWeightClick(wr)}><Edit3 className="h-4 w-4"/></Button>
                          
                          <Dialog open={!!weightRateToDelete && weightRateToDelete.id === wr.id} onOpenChange={(isOpen) => !isOpen && setWeightRateToDelete(null)}>
                            <DialogTrigger asChild>
                               <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setWeightRateToDelete(wr)}><Trash2 className="h-4 w-4"/></Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Confirm Delete Weight Rate</DialogTitle>
                                <DialogDescription>Are you sure you want to delete the weight rate: <strong>{weightRateToDelete?.weightLabel}</strong> for <strong>{selectedCountryForWeights?.name}</strong>? This is irreversible.</DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                <DialogClose asChild><Button variant="outline" onClick={() => setWeightRateToDelete(null)}>Cancel</Button></DialogClose>
                                <Button variant="destructive" onClick={handleDeleteWeightRate} disabled={isDeletingWeight}>
                                    {isDeletingWeight ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete Rate
                                </Button>
                                </DialogFooter>
                            </DialogContent>
                           </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
