
"use client";

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc, writeBatch, updateDoc, where } from 'firebase/firestore';
import type { CountryRate, WeightRate } from '@/types/shippingRates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription as ShadFormDescription } from '@/components/ui/form';
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
import { AlertTriangle, CheckCircle2, Trash2, PlusCircle, ListOrdered, Globe, Loader2, Edit3, Settings2, XCircle, Save, BookOpen, PackageOpen, FileArchive, ArrowLeft } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';


const addCountrySchema = z.object({
  name: z.string().min(2, "Country name must be at least 2 characters.").max(50, "Country name too long."),
});
type AddCountryFormValues = z.infer<typeof addCountrySchema>;

const weightRateSchema = z.object({
  weightLabel: z.string().min(1, "Weight label is required (e.g., '0.5 kg', '1-2 kg').").max(50,"Label too long."),
  weightValue: z.coerce.number().positive("Weight value must be a positive number (for sorting)."),

  ndEconomyPrice: z.coerce.number().nonnegative("Price must be 0 or positive.").optional().nullable(),
  ndExpressPrice: z.coerce.number().nonnegative("Price must be 0 or positive.").optional().nullable(),
  isNdEconomyEnabled: z.boolean().default(true),
  isNdExpressEnabled: z.boolean().default(true),

  docEconomyPrice: z.coerce.number().nonnegative("Price must be 0 or positive.").optional().nullable(),
  docExpressPrice: z.coerce.number().nonnegative("Price must be 0 or positive.").optional().nullable(),
  isDocEconomyEnabled: z.boolean().default(true),
  isDocExpressEnabled: z.boolean().default(true),
});
type WeightRateFormValues = z.infer<typeof weightRateSchema>;


export default function ManageRatesPage() {
  const [currentView, setCurrentView] = useState<'countries' | 'weights'>('countries');
  const [countries, setCountries] = useState<CountryRate[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [isSubmittingCountry, setIsSubmittingCountry] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<CountryRate | null>(null);
  const [isDeletingCountry, setIsDeletingCountry] = useState(false);

  const [selectedCountryForWeights, setSelectedCountryForWeights] = useState<CountryRate | null>(null);
  const [currentWeights, setCurrentWeights] = useState<WeightRate[]>([]);
  const [loadingWeights, setLoadingWeights] = useState(false);
  const [isSubmittingNewWeight, setIsSubmittingNewWeight] = useState(false);
  const [weightRateToDelete, setWeightRateToDelete] = useState<WeightRate | null>(null);
  const [isDeletingWeight, setIsDeletingWeight] = useState(false);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);


  const { toast } = useToast();

  const countryForm = useForm<AddCountryFormValues>({
    resolver: zodResolver(addCountrySchema),
    defaultValues: { name: '' },
  });

  const weightRateForm = useForm<WeightRateFormValues>({
    resolver: zodResolver(weightRateSchema),
    defaultValues: {
      weightLabel: '',
      weightValue: '' as any, 
      ndEconomyPrice: null,
      ndExpressPrice: null,
      isNdEconomyEnabled: true,
      isNdExpressEnabled: true,
      docEconomyPrice: null,
      docExpressPrice: null,
      isDocEconomyEnabled: true,
      isDocExpressEnabled: true,
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
      console.error(`Error fetching countries:`, error);
      toast({ title: "Error", description: `Could not fetch countries.`, variant: "destructive" });
    } finally {
      setLoadingCountries(false);
    }
  };

  useEffect(() => {
    if (currentView === 'countries') {
      fetchCountries();
    }
  }, [currentView]);

  const onAddCountrySubmit: SubmitHandler<AddCountryFormValues> = async (data) => {
    setIsSubmittingCountry(true);
    try {
      const ratesCol = collection(db, 'shipping_rates');
      const q = query(ratesCol, where('name', '==', data.name));
      const existingSnapshot = await getDocs(q);

      if (!existingSnapshot.empty) {
        toast({ title: "Duplicate Country", description: `A country with the name '${data.name}' already exists.`, variant: "destructive" });
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
      batch.delete(doc(db, 'shipping_rates', countryToDelete.id));
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
    setCurrentView('weights');
  };
  
  const onAddWeightSubmit: SubmitHandler<WeightRateFormValues> = async (data) => {
    if (!selectedCountryForWeights) return;
    setIsSubmittingNewWeight(true);

    const processedData = {
        ...data,
        weightValue: Number(data.weightValue),
        ndEconomyPrice: (data.ndEconomyPrice === '' || data.ndEconomyPrice === undefined || data.ndEconomyPrice === null || isNaN(Number(data.ndEconomyPrice))) ? null : Number(data.ndEconomyPrice),
        ndExpressPrice: (data.ndExpressPrice === '' || data.ndExpressPrice === undefined || data.ndExpressPrice === null || isNaN(Number(data.ndExpressPrice))) ? null : Number(data.ndExpressPrice),
        docEconomyPrice: (data.docEconomyPrice === '' || data.docEconomyPrice === undefined || data.docEconomyPrice === null || isNaN(Number(data.docEconomyPrice))) ? null : Number(data.docEconomyPrice),
        docExpressPrice: (data.docExpressPrice === '' || data.docExpressPrice === undefined || data.docExpressPrice === null || isNaN(Number(data.docExpressPrice))) ? null : Number(data.docExpressPrice),
    };
    
    const dataToSave: Partial<WeightRate> = { 
        ...processedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    try {
        const weightsColRef = collection(db, 'shipping_rates', selectedCountryForWeights.id, 'weights');
        await addDoc(weightsColRef, dataToSave);
        toast({ title: "Success", description: "New weight rate added.", variant: "default" });
        weightRateForm.reset({
          weightLabel: '', weightValue: '' as any,
          ndEconomyPrice: null, ndExpressPrice: null, isNdEconomyEnabled: true, isNdExpressEnabled: true,
          docEconomyPrice: null, docExpressPrice: null, isDocEconomyEnabled: true, isDocExpressEnabled: true
        });
        fetchWeightsForCountry(selectedCountryForWeights.id);
    } catch (error) {
        console.error("Error adding weight rate:", error);
        toast({ title: "Error", description: "Could not add weight rate.", variant: "destructive" });
    } finally {
        setIsSubmittingNewWeight(false);
    }
  };

  const handleInlineWeightChange = (index: number, field: keyof WeightRate, value: string | number | boolean) => {
    const updatedWeights = [...currentWeights];
    const weightToUpdate = { ...updatedWeights[index] };
    (weightToUpdate as any)[field] = value;
    updatedWeights[index] = weightToUpdate;
    setCurrentWeights(updatedWeights);
  };


  const handleSaveWeight = async (weightRate: WeightRate) => {
    if (!selectedCountryForWeights || !weightRate.id) return;
    setSavingRowId(weightRate.id);
    try {
        const weightDocRef = doc(db, 'shipping_rates', selectedCountryForWeights.id, 'weights', weightRate.id);
        
        const dataToSave = {
            weightLabel: weightRate.weightLabel,
            weightValue: Number(weightRate.weightValue),
            isNdEconomyEnabled: weightRate.isNdEconomyEnabled,
            ndEconomyPrice: (weightRate.ndEconomyPrice === '' || weightRate.ndEconomyPrice === undefined || weightRate.ndEconomyPrice === null || isNaN(Number(weightRate.ndEconomyPrice))) ? null : Number(weightRate.ndEconomyPrice),
            isNdExpressEnabled: weightRate.isNdExpressEnabled,
            ndExpressPrice: (weightRate.ndExpressPrice === '' || weightRate.ndExpressPrice === undefined || weightRate.ndExpressPrice === null || isNaN(Number(weightRate.ndExpressPrice))) ? null : Number(weightRate.ndExpressPrice),
            isDocEconomyEnabled: weightRate.isDocEconomyEnabled,
            docEconomyPrice: (weightRate.docEconomyPrice === '' || weightRate.docEconomyPrice === undefined || weightRate.docEconomyPrice === null || isNaN(Number(weightRate.docEconomyPrice))) ? null : Number(weightRate.docEconomyPrice),
            isDocExpressEnabled: weightRate.isDocExpressEnabled,
            docExpressPrice: (weightRate.docExpressPrice === '' || weightRate.docExpressPrice === undefined || weightRate.docExpressPrice === null || isNaN(Number(weightRate.docExpressPrice))) ? null : Number(weightRate.docExpressPrice),
            updatedAt: serverTimestamp(),
        };

        await updateDoc(weightDocRef, dataToSave as any);
        toast({ title: "Success", description: `Weight rate for ${weightRate.weightLabel} updated.`, variant: "default" });
    } catch (error) {
        console.error("Error updating weight rate:", error);
        toast({ title: "Error", description: "Could not save weight rate.", variant: "destructive" });
        // Optional: refetch data to revert optimistic UI change on failure
        fetchWeightsForCountry(selectedCountryForWeights.id);
    } finally {
        setSavingRowId(null);
    }
  };


  const handleDeleteWeightRate = async () => {
    if (!selectedCountryForWeights || !weightRateToDelete) return;
    setIsDeletingWeight(true);
    try {
      await deleteDoc(doc(db, 'shipping_rates', selectedCountryForWeights.id, 'weights', weightRateToDelete.id));
      toast({ title: "Success", description: `Weight rate ${weightRateToDelete.weightLabel} deleted.`, variant: "default" });
      setCurrentWeights(currentWeights.filter(wr => wr.id !== weightRateToDelete.id));
      setWeightRateToDelete(null);
    } catch (error) {
      console.error("Error deleting weight rate:", error);
      toast({ title: "Error", description: "Could not delete weight rate.", variant: "destructive" });
    } finally {
      setIsDeletingWeight(false);
    }
  };

  const handleBackToCountries = () => {
    setCurrentView('countries');
    setSelectedCountryForWeights(null);
    setCurrentWeights([]);
  };

  if (currentView === 'weights' && selectedCountryForWeights) {
    return (
      <div className="space-y-6 opacity-0 animate-fadeInUp">
        <Button variant="outline" onClick={handleBackToCountries} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Countries
        </Button>
        <div className="w-full">
          <Card className="shadow-xl border-border/50">
              <CardHeader>
                  <CardTitle className="flex items-center text-2xl font-headline text-accent">
                      <BookOpen className="mr-3 h-7 w-7 text-primary" /> Manage Weights for {selectedCountryForWeights.name}
                  </CardTitle>
                  <CardDescription>Add new rates using the form or edit existing rates directly in the table below.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Form {...weightRateForm}>
                  <form onSubmit={weightRateForm.handleSubmit(onAddWeightSubmit)} className="space-y-6 border p-4 rounded-md mt-4">
                      <h3 className="text-lg font-medium">Add New Weight Rate</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={weightRateForm.control} name="weightLabel" render={({ field }) => (
                            <FormItem> <FormLabel>Weight Label</FormLabel> <FormControl><Input placeholder="e.g., 1 kg, 2-3 kg" {...field} /></FormControl> <FormMessage /> </FormItem>
                        )} />
                        <FormField control={weightRateForm.control} name="weightValue" render={({ field }) => (
                            <FormItem>
                            <FormLabel>Weight Value (kg)</FormLabel>
                            <FormControl>
                                <Input type="number" step="0.01" placeholder="e.g., 1 or 2.5" {...field} value={field.value ?? ''}/>
                            </FormControl>
                            <ShadFormDescription>Numeric value for sorting (e.g., 0.5 for 500g).</ShadFormDescription>
                            <FormMessage />
                            </FormItem>
                        )} />
                      </div>
                      {/* Price fields for new entry can be added here if needed, or kept simple */}
                      <Button type="submit" disabled={isSubmittingNewWeight}>
                          {isSubmittingNewWeight ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                          Add New Rate
                      </Button>
                  </form>
                  </Form>

                  <div className="mt-8">
                  <h4 className="text-lg font-medium mb-2">Existing Weight Rates for {selectedCountryForWeights?.name}</h4>
                  {loadingWeights ? (
                      <div className="flex justify-center items-center py-6"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="ml-2">Loading rates...</p></div>
                  ) : currentWeights.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">No weight rates added for this country yet.</p>
                  ) : (
                      <ScrollArea className="h-[60vh] w-full border rounded-md">
                      <Table className="min-w-[1200px]">
                          <TableHeader className="sticky top-0 bg-card z-10">
                          <TableRow>
                              <TableHead className="w-[150px]">Label</TableHead>
                              <TableHead className="w-[100px]">Value (kg)</TableHead>
                              <TableHead>ND Econ.</TableHead>
                              <TableHead>ND Exp.</TableHead>
                              <TableHead>Doc Econ.</TableHead>
                              <TableHead>Doc Exp.</TableHead>
                              <TableHead className="w-[200px] text-center">Actions</TableHead>
                          </TableRow>
                          </TableHeader>
                          <TableBody>{currentWeights.map((wr, index) => (
                          <TableRow key={wr.id}>
                              <TableCell><Input value={wr.weightLabel ?? ''} onChange={e => handleInlineWeightChange(index, 'weightLabel', e.target.value)}/></TableCell>
                              <TableCell><Input type="number" step="0.01" value={wr.weightValue ?? ''} onChange={e => handleInlineWeightChange(index, 'weightValue', e.target.value)} /></TableCell>
                              
                              <TableCell className="space-y-2">
                                <Switch checked={wr.isNdEconomyEnabled} onCheckedChange={c => handleInlineWeightChange(index, 'isNdEconomyEnabled', c)} />
                                <Input type="number" step="0.01" disabled={!wr.isNdEconomyEnabled} placeholder="Price" value={wr.ndEconomyPrice ?? ''} onChange={e => handleInlineWeightChange(index, 'ndEconomyPrice', e.target.value)} />
                              </TableCell>
                              <TableCell className="space-y-2">
                                <Switch checked={wr.isNdExpressEnabled} onCheckedChange={c => handleInlineWeightChange(index, 'isNdExpressEnabled', c)} />
                                <Input type="number" step="0.01" disabled={!wr.isNdExpressEnabled} placeholder="Price" value={wr.ndExpressPrice ?? ''} onChange={e => handleInlineWeightChange(index, 'ndExpressPrice', e.target.value)} />
                              </TableCell>
                              <TableCell className="space-y-2">
                                <Switch checked={wr.isDocEconomyEnabled} onCheckedChange={c => handleInlineWeightChange(index, 'isDocEconomyEnabled', c)} />
                                <Input type="number" step="0.01" disabled={!wr.isDocEconomyEnabled} placeholder="Price" value={wr.docEconomyPrice ?? ''} onChange={e => handleInlineWeightChange(index, 'docEconomyPrice', e.target.value)} />
                              </TableCell>
                              <TableCell className="space-y-2">
                                <Switch checked={wr.isDocExpressEnabled} onCheckedChange={c => handleInlineWeightChange(index, 'isDocExpressEnabled', c)} />
                                <Input type="number" step="0.01" disabled={!wr.isDocExpressEnabled} placeholder="Price" value={wr.docExpressPrice ?? ''} onChange={e => handleInlineWeightChange(index, 'docExpressPrice', e.target.value)} />
                              </TableCell>

                              <TableCell className="text-center space-x-1">
                                <Button size="sm" onClick={() => handleSaveWeight(wr)} disabled={savingRowId === wr.id}>
                                    {savingRowId === wr.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Save className="h-4 w-4"/>}
                                    <span className="ml-2 hidden sm:inline">Save</span>
                                </Button>
                              
                                <AlertDialog open={!!weightRateToDelete && weightRateToDelete.id === wr.id} onOpenChange={(isOpen) => !isOpen && setWeightRateToDelete(null)}>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" onClick={() => setWeightRateToDelete(wr)}><Trash2 className="h-4 w-4"/><span className="ml-2 hidden sm:inline">Del</span></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm Delete Weight Rate</AlertDialogTitle>
                                        <AlertDialogDescription>Are you sure you want to delete the weight rate: <strong>{weightRateToDelete?.weightLabel}</strong>? This is irreversible.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setWeightRateToDelete(null)}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteWeightRate} disabled={isDeletingWeight} className={buttonVariants({variant: "destructive"})}>
                                            {isDeletingWeight ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete Rate
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                          </TableRow>
                          ))}</TableBody>
                      </Table>
                      </ScrollArea>
                  )}
                  </div>
              </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 opacity-0 animate-fadeInUp">
        <Button asChild variant="outline">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <Settings2 className="mr-3 h-7 w-7 text-primary" /> Manage Shipping Rates
          </CardTitle>
          <CardDescription>Add countries, then manage their specific shipping weight rates and prices.</CardDescription>
        </CardHeader>
      </Card>

      <div className="max-w-4xl mx-auto w-full">
        <div className="space-y-6 mt-4">
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
                      <FormItem className="flex-grow w-full">
                        <FormLabel className="sr-only">Country Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter country name (e.g., United States)" {...field} />
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
                <p className="text-muted-foreground text-center py-6">No countries added yet.</p>
              ) : (
                <div className="overflow-x-auto">
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
                            <Button variant="outline" size="sm" onClick={() => handleManageWeightsClick(country)} className="text-primary border-primary hover:bg-primary/10 hover:text-primary">
                              <BookOpen className="mr-2 h-4 w-4"/> Manage Weights
                            </Button>
                            
                            <AlertDialog open={!!countryToDelete && countryToDelete.id === country.id} onOpenChange={(isOpen) => !isOpen && setCountryToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" onClick={() => setCountryToDelete(country)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Delete Country</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete <strong>{countryToDelete?.name}</strong>? This also deletes all its weight rates. This is irreversible.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setCountryToDelete(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteCountry} disabled={isDeletingCountry} className={buttonVariants({variant: "destructive"})}>
                                      {isDeletingCountry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
      </div>
    </div>
  );
}
