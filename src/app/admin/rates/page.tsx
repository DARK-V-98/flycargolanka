
"use client";

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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


const addCountrySchema = z.object({
  name: z.string().min(2, "Country name must be at least 2 characters.").max(50, "Country name too long."),
});
type AddCountryFormValues = z.infer<typeof addCountrySchema>;

const weightRateSchema = z.object({
  id: z.string().optional(),
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
    setEditingWeightRate(null);
    weightRateForm.reset({
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
    });
    setCurrentView('weights');
  };

  const onAddEditWeightSubmit: SubmitHandler<WeightRateFormValues> = async (data) => {
    if (!selectedCountryForWeights) return;
    setIsSubmittingWeight(true);

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
        updatedAt: serverTimestamp(),
    };
    if (!editingWeightRate?.id) {
        dataToSave.createdAt = serverTimestamp();
    }

    try {
      if (editingWeightRate && editingWeightRate.id) {
        const weightDocRef = doc(db, 'shipping_rates', selectedCountryForWeights.id, 'weights', editingWeightRate.id);
        await updateDoc(weightDocRef, dataToSave);
        toast({ title: "Success", description: "Weight rate updated.", variant: "default" });
      } else {
        const weightsColRef = collection(db, 'shipping_rates', selectedCountryForWeights.id, 'weights');
        await addDoc(weightsColRef, dataToSave);
        toast({ title: "Success", description: "Weight rate added.", variant: "default" });
      }
      weightRateForm.reset({
          weightLabel: '', weightValue: '' as any,
          ndEconomyPrice: null, ndExpressPrice: null, isNdEconomyEnabled: true, isNdExpressEnabled: true,
          docEconomyPrice: null, docExpressPrice: null, isDocEconomyEnabled: true, isDocExpressEnabled: true
      });
      setEditingWeightRate(null);
      fetchWeightsForCountry(selectedCountryForWeights.id);
    } catch (error) {
      console.error("Error saving weight rate:", error);
      toast({ title: "Error", description: "Could not save weight rate.", variant: "destructive" });
    } finally {
      setIsSubmittingWeight(false);
    }
  };

  const handleEditWeightClick = (weightRate: WeightRate) => {
    const formData = {
        id: weightRate.id,
        weightLabel: weightRate.weightLabel,
        weightValue: weightRate.weightValue,
        ndEconomyPrice: weightRate.ndEconomyPrice,
        ndExpressPrice: weightRate.ndExpressPrice,
        isNdEconomyEnabled: weightRate.isNdEconomyEnabled === undefined ? true : weightRate.isNdEconomyEnabled,
        isNdExpressEnabled: weightRate.isNdExpressEnabled === undefined ? true : weightRate.isNdExpressEnabled,
        docEconomyPrice: weightRate.docEconomyPrice,
        docExpressPrice: weightRate.docExpressPrice,
        isDocEconomyEnabled: weightRate.isDocEconomyEnabled === undefined ? true : weightRate.isDocEconomyEnabled,
        isDocExpressEnabled: weightRate.isDocExpressEnabled === undefined ? true : weightRate.isDocExpressEnabled,
    };
    setEditingWeightRate(formData);
    weightRateForm.reset({
        ...formData,
        weightValue: formData.weightValue !== null && formData.weightValue !== undefined ? String(formData.weightValue) : '',
        ndEconomyPrice: formData.ndEconomyPrice !== null && formData.ndEconomyPrice !== undefined ? formData.ndEconomyPrice : null,
        ndExpressPrice: formData.ndExpressPrice !== null && formData.ndExpressPrice !== undefined ? formData.ndExpressPrice : null,
        docEconomyPrice: formData.docEconomyPrice !== null && formData.docEconomyPrice !== undefined ? formData.docEconomyPrice : null,
        docExpressPrice: formData.docExpressPrice !== null && formData.docExpressPrice !== undefined ? formData.docExpressPrice : null,
    });
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
    setEditingWeightRate(null);
    weightRateForm.reset({
        weightLabel: '', weightValue: '' as any,
        ndEconomyPrice: null, ndExpressPrice: null, isNdEconomyEnabled: true, isNdExpressEnabled: true,
        docEconomyPrice: null, docExpressPrice: null, isDocEconomyEnabled: true, isDocExpressEnabled: true
    });
  };

  if (currentView === 'weights' && selectedCountryForWeights) {
    return (
      <div className="space-y-6 opacity-0 animate-fadeInUp">
        <Button variant="outline" onClick={handleBackToCountries} className="mb-2 sm:mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Countries
        </Button>
        <Card className="shadow-xl border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl md:text-2xl font-headline text-accent">
                    <BookOpen className="mr-2 h-5 sm:h-6 md:h-7 w-5 sm:w-6 md:w-7 text-primary" /> Manage Weights &amp; Prices for {selectedCountryForWeights.name}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">Add, edit, or delete weight rates. Specify prices for Non-Document and Document types.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto">
                <Form {...weightRateForm}>
                <form onSubmit={weightRateForm.handleSubmit(onAddEditWeightSubmit)} className="space-y-4 sm:space-y-6 border p-2 sm:p-4 rounded-md mt-2 sm:mt-4">
                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3">{editingWeightRate ? "Edit Weight Rate" : "Add New Weight Rate"}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 sm:gap-y-3">
                    <FormField control={weightRateForm.control} name="weightLabel" render={({ field }) => (
                        <FormItem> <FormLabel className="text-xs sm:text-sm">Weight Label</FormLabel> <FormControl><Input placeholder="e.g., 1 kg, 2-3 kg" {...field} className="text-sm" /></FormControl> <FormMessage /> </FormItem>
                    )} />
                    <FormField control={weightRateForm.control} name="weightValue" render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-xs sm:text-sm">Weight Value (kg)</FormLabel>
                        <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 1 or 2.5" {...field} value={field.value ?? ''}
                            onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? '' : (isNaN(parseFloat(valStr)) ? '' : parseFloat(valStr))); }} className="text-sm"/>
                        </FormControl>
                        <ShadFormDescription className="text-xs">Numeric value for sorting (e.g., 0.5 for 500g).</ShadFormDescription>
                        <FormMessage />
                        </FormItem>
                    )} />
                    </div>

                    <div className="space-y-3 sm:space-y-4 border p-2 sm:p-3 md:p-4 rounded-md mt-2 sm:mt-2">
                    <h4 className="text-sm sm:text-md font-semibold flex items-center"><PackageOpen className="mr-2 h-4 sm:h-5 w-4 sm:w-5 text-primary"/>Non-Document Rates</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 sm:gap-y-3">
                        <FormField control={weightRateForm.control} name="ndEconomyPrice" render={({ field }) => (
                        <FormItem> <FormLabel className="text-xs sm:text-sm">Economy Price (LKR)</FormLabel> <FormControl>
                            <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''}
                            onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? null : (isNaN(parseFloat(valStr)) ? null : parseFloat(valStr))); }} className="text-sm"/>
                        </FormControl> <FormMessage /> </FormItem>
                        )} />
                        <FormField control={weightRateForm.control} name="ndExpressPrice" render={({ field }) => (
                        <FormItem> <FormLabel className="text-xs sm:text-sm">Express Price (LKR)</FormLabel> <FormControl>
                            <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''}
                            onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? null : (isNaN(parseFloat(valStr)) ? null : parseFloat(valStr))); }} className="text-sm"/>
                        </FormControl> <FormMessage /> </FormItem>
                        )} />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <FormField control={weightRateForm.control} name="isNdEconomyEnabled" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-1.5 sm:p-2 shadow-sm flex-1">
                                <div className="space-y-0.5 mr-2 sm:mr-3"> <FormLabel className="text-xs sm:text-sm">Enable Economy</FormLabel> <ShadFormDescription className="text-xs">Non-doc economy.</ShadFormDescription> </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={weightRateForm.control} name="isNdExpressEnabled" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-1.5 sm:p-2 shadow-sm flex-1">
                                <div className="space-y-0.5 mr-2 sm:mr-3"> <FormLabel className="text-xs sm:text-sm">Enable Express</FormLabel> <ShadFormDescription className="text-xs">Non-doc express.</ShadFormDescription> </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    </div>

                    <div className="space-y-3 sm:space-y-4 border p-2 sm:p-3 md:p-4 rounded-md mt-2 sm:mt-4">
                    <h4 className="text-sm sm:text-md font-semibold flex items-center"><FileArchive className="mr-2 h-4 sm:h-5 w-4 sm:w-5 text-primary"/>Document Rates</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 sm:gap-y-3">
                        <FormField control={weightRateForm.control} name="docEconomyPrice" render={({ field }) => (
                        <FormItem> <FormLabel className="text-xs sm:text-sm">Economy Price (LKR)</FormLabel> <FormControl>
                            <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''}
                            onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? null : (isNaN(parseFloat(valStr)) ? null : parseFloat(valStr))); }} className="text-sm"/>
                        </FormControl> <FormMessage /> </FormItem>
                        )} />
                        <FormField control={weightRateForm.control} name="docExpressPrice" render={({ field }) => (
                        <FormItem> <FormLabel className="text-xs sm:text-sm">Express Price (LKR)</FormLabel> <FormControl>
                            <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''}
                            onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? null : (isNaN(parseFloat(valStr)) ? null : parseFloat(valStr))); }} className="text-sm"/>
                        </FormControl> <FormMessage /> </FormItem>
                        )} />
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                        <FormField control={weightRateForm.control} name="isDocEconomyEnabled" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-1.5 sm:p-2 shadow-sm flex-1">
                                <div className="space-y-0.5 mr-2 sm:mr-3"> <FormLabel className="text-xs sm:text-sm">Enable Economy</FormLabel> <ShadFormDescription className="text-xs">Doc economy.</ShadFormDescription> </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                        <FormField control={weightRateForm.control} name="isDocExpressEnabled" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-1.5 sm:p-2 shadow-sm flex-1">
                                <div className="space-y-0.5 mr-2 sm:mr-3"> <FormLabel className="text-xs sm:text-sm">Enable Express</FormLabel> <ShadFormDescription className="text-xs">Doc express.</ShadFormDescription> </div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />
                    </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-1 sm:pt-2">
                    {editingWeightRate && <Button type="button" variant="outline" size="sm" onClick={() => { setEditingWeightRate(null); weightRateForm.reset({
                        weightLabel: '', weightValue: '' as any,
                        ndEconomyPrice: null, ndExpressPrice: null, isNdEconomyEnabled: true, isNdExpressEnabled: true,
                        docEconomyPrice: null, docExpressPrice: null, isDocEconomyEnabled: true, isDocExpressEnabled: true
                    }); }} className="w-full sm:w-auto text-xs sm:text-sm">Cancel Edit</Button>}
                    <Button type="submit" disabled={isSubmittingWeight} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
                        {isSubmittingWeight ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {editingWeightRate ? "Update Rate" : "Add Rate"}
                    </Button>
                    </div>
                </form>
                </Form>

                <div className="mt-4 sm:mt-6">
                <h4 className="text-sm sm:text-md font-medium mb-1 sm:mb-2">Existing Weight Rates for {selectedCountryForWeights?.name}</h4>
                {loadingWeights ? (
                    <div className="flex justify-center items-center py-4"><Loader2 className="h-5 sm:h-6 w-5 sm:h-6 animate-spin text-primary" /><p className="ml-2 text-xs sm:text-sm">Loading rates...</p></div>
                ) : currentWeights.length === 0 ? (
                    <p className="text-muted-foreground text-xs sm:text-sm text-center py-4">No weight rates added for this country yet.</p>
                ) : (
                    <div className="overflow-x-auto max-h-[300px] sm:max-h-[400px] md:max-h-[5vh]">
                    <Table className="min-w-[800px] sm:min-w-[900px]">
                        <TableHeader className="sticky top-0 bg-card z-20">
                        <TableRow>
                            <TableHead className="px-1.5 py-1 text-xs sticky left-0 bg-card z-10 whitespace-nowrap">Label</TableHead>
                            <TableHead className="px-1.5 py-1 text-xs text-center whitespace-nowrap">Value (kg)</TableHead>
                            <TableHead className="px-1.5 py-1 text-xs text-center whitespace-nowrap">ND Econ. (LKR)</TableHead>
                            <TableHead className="px-1.5 py-1 text-xs text-center whitespace-nowrap">ND Exp. (LKR)</TableHead>
                            <TableHead className="px-1.5 py-1 text-xs text-center whitespace-nowrap">Doc Econ. (LKR)</TableHead>
                            <TableHead className="px-1.5 py-1 text-xs text-center whitespace-nowrap">Doc Exp. (LKR)</TableHead>
                            <TableHead className="px-1.5 py-1 text-xs text-right sticky right-0 bg-card z-10 whitespace-nowrap">Actions</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>{currentWeights.map((wr) => (
                        <TableRow key={wr.id}>
                            <TableCell className="font-medium px-1.5 py-1 text-xs sticky left-0 bg-card z-0 whitespace-nowrap">{wr.weightLabel}</TableCell>
                            <TableCell className="px-1.5 py-1 text-xs text-center whitespace-nowrap">{wr.weightValue}</TableCell>
                            <TableCell className="px-1.5 py-1 text-xs text-center whitespace-nowrap">{wr.isNdEconomyEnabled ? (wr.ndEconomyPrice !== null && wr.ndEconomyPrice !== undefined ? wr.ndEconomyPrice : <XCircle className="h-3 w-3 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Off</span>}</TableCell>
                            <TableCell className="px-1.5 py-1 text-xs text-center whitespace-nowrap">{wr.isNdExpressEnabled ? (wr.ndExpressPrice !== null && wr.ndExpressPrice !== undefined ? wr.ndExpressPrice : <XCircle className="h-3 w-3 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Off</span>}</TableCell>
                            <TableCell className="px-1.5 py-1 text-xs text-center whitespace-nowrap">{wr.isDocEconomyEnabled ? (wr.docEconomyPrice !== null && wr.docEconomyPrice !== undefined ? wr.docEconomyPrice : <XCircle className="h-3 w-3 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Off</span>}</TableCell>
                            <TableCell className="px-1.5 py-1 text-xs text-center whitespace-nowrap">{wr.isDocExpressEnabled ? (wr.docExpressPrice !== null && wr.docExpressPrice !== undefined ? wr.docExpressPrice : <XCircle className="h-3 w-3 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Off</span>}</TableCell>
                            <TableCell className="px-1.5 py-1 text-xs text-right space-x-0.5 sm:space-x-1 sticky right-0 bg-card z-0 whitespace-nowrap">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEditWeightClick(wr)}><Edit3 className="h-3 w-3"/></Button>
                            
                            <AlertDialog open={!!weightRateToDelete && weightRateToDelete.id === wr.id} onOpenChange={(isOpen) => !isOpen && setWeightRateToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setWeightRateToDelete(wr)}><Trash2 className="h-3 w-3"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-base sm:text-lg">Confirm Delete Weight Rate</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs sm:text-sm">Are you sure you want to delete the weight rate: <strong>{weightRateToDelete?.weightLabel}</strong> for <strong>{selectedCountryForWeights?.name}</strong>? This is irreversible.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setWeightRateToDelete(null)} className="text-xs sm:text-sm">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteWeightRate} disabled={isDeletingWeight} className={buttonVariants({variant: "destructive", size: "sm"})}>
                                    {isDeletingWeight ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete Rate
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            </TableCell>
                        </TableRow>
                        ))}</TableBody>
                    </Table>
                    </div>
                )}
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 opacity-0 animate-fadeInUp">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-xl sm:text-2xl font-headline text-accent">
            <Settings2 className="mr-2 sm:mr-3 h-6 sm:h-7 w-6 sm:w-7 text-primary" /> Manage Shipping Rates
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">Add countries, then manage their specific shipping weight rates and prices for both document and non-document types.</CardDescription>
        </CardHeader>
      </Card>

      <div className="max-w-4xl mx-auto w-full">
        <div className="space-y-4 sm:space-y-6 mt-2 sm:mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl font-headline text-accent">
                <Globe className="mr-2 h-5 w-5 text-primary" /> Add New Country
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...countryForm}>
                <form onSubmit={countryForm.handleSubmit(onAddCountrySubmit)} className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start">
                  <FormField
                    control={countryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex-grow w-full sm:w-auto">
                        <FormLabel className="sr-only">Country Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter country name (e.g., Sri Lanka)" {...field} className="text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isSubmittingCountry} className="w-full sm:w-auto text-xs sm:text-sm" size="sm">
                    {isSubmittingCountry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Add Country
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl font-headline text-accent">
                <ListOrdered className="mr-2 h-5 w-5 text-primary" /> Configured Countries
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCountries ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-6 sm:h-8 w-6 sm:h-8 animate-spin text-primary" /> <p className="ml-2 text-sm sm:text-base">Loading countries...</p>
                </div>
              ) : countries.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No countries added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-1.5 sm:px-2 py-1.5 sm:py-2 text-xs sm:text-sm">Country Name</TableHead>
                        <TableHead className="text-right px-1.5 sm:px-2 py-1.5 sm:py-2 text-xs sm:text-sm">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countries.map((country) => (
                        <TableRow key={country.id}>
                          <TableCell className="font-medium px-1.5 sm:px-2 py-1.5 sm:py-2 text-xs sm:text-sm">{country.name}</TableCell>
                          <TableCell className="text-right space-x-1 px-1.5 sm:px-2 py-1.5 sm:py-2">
                            <Button variant="outline" size="sm" onClick={() => handleManageWeightsClick(country)} className="text-primary border-primary hover:bg-primary/10 hover:text-primary text-xs sm:text-sm px-2 sm:px-3">
                              <BookOpen className="mr-1 h-3 w-3"/> Manage Weights
                            </Button>
                            
                            <AlertDialog open={!!countryToDelete && countryToDelete.id === country.id} onOpenChange={(isOpen) => !isOpen && setCountryToDelete(null)}>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm" onClick={() => setCountryToDelete(country)} className="text-xs sm:text-sm px-2 sm:px-3">
                                    <Trash2 className="mr-1 h-3 w-3" /> Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-base sm:text-lg">Confirm Delete Country</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs sm:text-sm">Are you sure you want to delete <strong>{countryToDelete?.name}</strong>? This also deletes all its weight rates. This is irreversible.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setCountryToDelete(null)} className="text-xs sm:text-sm">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDeleteCountry} disabled={isDeletingCountry} className={buttonVariants({variant: "destructive", size: "sm"})}>
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

