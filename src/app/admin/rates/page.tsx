
"use client";

import { useEffect, useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs, deleteDoc, doc, writeBatch, updateDoc, where } from 'firebase/firestore';
import type { CountryRate, WeightRate } from '@/types/shippingRates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
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
import { AlertTriangle, CheckCircle2, Trash2, PlusCircle, ListOrdered, Globe, Loader2, Edit3, Settings2, XCircle, Save, BookOpen, PackageOpen, FileArchive } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription as DialogDescriptionComponent,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

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
    fetchCountries();
  }, []);

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
    setIsWeightsModalOpen(true);
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


  return (
    <div className="space-y-6 opacity-0 animate-fadeInUp">
      <Card className="shadow-xl border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center text-2xl font-headline text-accent">
            <Settings2 className="mr-3 h-7 w-7 text-primary" /> Manage Shipping Rates
          </CardTitle>
          <CardDescription>Add countries, then manage their specific shipping weight rates and prices for both document and non-document types.</CardDescription>
        </CardHeader>
      </Card>

      <div className="max-w-6xl mx-auto w-full">
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
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-2 py-2 sm:px-4">Country Name</TableHead>
                        <TableHead className="text-right px-2 py-2 sm:px-4">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {countries.map((country) => (
                        <TableRow key={country.id}>
                          <TableCell className="font-medium px-2 py-2 sm:px-4">{country.name}</TableCell>
                          <TableCell className="text-right space-x-1 sm:space-x-2 px-2 py-2 sm:px-4">
                            <Button variant="outline" size="sm" onClick={() => handleManageWeightsClick(country)} className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 text-xs sm:text-sm px-2 sm:px-3">
                              <BookOpen className="mr-1 h-3 w-3 sm:h-4 sm:w-4"/> Manage Weights
                            </Button>
                            <Dialog open={!!countryToDelete && countryToDelete.id === country.id} onOpenChange={(isOpen) => !isOpen && setCountryToDelete(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="destructive" size="sm" onClick={() => setCountryToDelete(country)} className="text-xs sm:text-sm px-2 sm:px-3">
                                    <Trash2 className="mr-1 h-3 w-3 sm:h-4 sm:w-4" /> Delete
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader> <DialogTitle>Confirm Delete Country</DialogTitle>
                                    <DialogDescriptionComponent>Are you sure you want to delete <strong>{countryToDelete?.name}</strong>? This also deletes all its weight rates. This is irreversible.</DialogDescriptionComponent>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild><Button variant="outline" onClick={() => setCountryToDelete(null)}>Cancel</Button></DialogClose>
                                    <Button variant="destructive" onClick={handleDeleteCountry} disabled={isDeletingCountry}>
                                      {isDeletingCountry ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete
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
            </CardContent>
          </Card>
        </div>
      </div>


      <Dialog open={isWeightsModalOpen} onOpenChange={(isOpen) => {
          setIsWeightsModalOpen(isOpen);
          if (!isOpen) {
              setSelectedCountryForWeights(null);
              setCurrentWeights([]);
              setEditingWeightRate(null);
              weightRateForm.reset({
                weightLabel: '', weightValue: '' as any,
                ndEconomyPrice: null, ndExpressPrice: null, isNdEconomyEnabled: true, isNdExpressEnabled: true,
                docEconomyPrice: null, docExpressPrice: null, isDocEconomyEnabled: true, isDocExpressEnabled: true
              });
          }
      }}>
        <DialogContent className="max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Manage Weights & Prices for {selectedCountryForWeights?.name}</DialogTitle>
            <DialogDescriptionComponent>Add, edit, or delete weight rates. Specify prices for Non-Document and Document types.</DialogDescriptionComponent>
          </DialogHeader>

          <Form {...weightRateForm}>
            <form onSubmit={weightRateForm.handleSubmit(onAddEditWeightSubmit)} className="space-y-6 border p-3 sm:p-4 rounded-md mt-4">
              <h3 className="text-lg font-medium mb-3">{editingWeightRate ? "Edit Weight Rate" : "Add New Weight Rate"}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                <FormField control={weightRateForm.control} name="weightLabel" render={({ field }) => (
                  <FormItem> <FormLabel>Weight Label</FormLabel> <FormControl><Input placeholder="e.g., 1 kg, 2-3 kg" {...field} /></FormControl> <FormMessage /> </FormItem>
                )} />
                <FormField control={weightRateForm.control} name="weightValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight Value (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 1 or 2.5" {...field} value={field.value ?? ''}
                        onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? '' : (isNaN(parseFloat(valStr)) ? '' : parseFloat(valStr))); }}/>
                    </FormControl>
                    <ShadFormDescription>Numeric value for sorting and calculation (e.g., 0.5 for 500g).</ShadFormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="space-y-4 border p-3 sm:p-4 rounded-md mt-2">
                <h4 className="text-md font-semibold flex items-center"><PackageOpen className="mr-2 h-5 w-5 text-primary"/>Non-Document Rates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <FormField control={weightRateForm.control} name="ndEconomyPrice" render={({ field }) => (
                    <FormItem> <FormLabel>Economy Price (LKR)</FormLabel> <FormControl>
                        <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''}
                        onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? null : (isNaN(parseFloat(valStr)) ? null : parseFloat(valStr))); }}/>
                    </FormControl> <FormMessage /> </FormItem>
                    )} />
                    <FormField control={weightRateForm.control} name="ndExpressPrice" render={({ field }) => (
                    <FormItem> <FormLabel>Express Price (LKR)</FormLabel> <FormControl>
                        <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''}
                        onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? null : (isNaN(parseFloat(valStr)) ? null : parseFloat(valStr))); }}/>
                    </FormControl> <FormMessage /> </FormItem>
                    )} />
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <FormField control={weightRateForm.control} name="isNdEconomyEnabled" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 sm:p-3 shadow-sm flex-1 min-w-[180px] sm:min-w-[200px]">
                            <div className="space-y-0.5 mr-2 sm:mr-4"> <FormLabel className="text-sm">Enable Economy</FormLabel> <ShadFormDescription className="text-xs">Non-document economy.</ShadFormDescription> </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={weightRateForm.control} name="isNdExpressEnabled" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 sm:p-3 shadow-sm flex-1 min-w-[180px] sm:min-w-[200px]">
                            <div className="space-y-0.5 mr-2 sm:mr-4"> <FormLabel className="text-sm">Enable Express</FormLabel> <ShadFormDescription className="text-xs">Non-document express.</ShadFormDescription> </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                </div>
              </div>

              <div className="space-y-4 border p-3 sm:p-4 rounded-md mt-4">
                 <h4 className="text-md font-semibold flex items-center"><FileArchive className="mr-2 h-5 w-5 text-primary"/>Document Rates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                    <FormField control={weightRateForm.control} name="docEconomyPrice" render={({ field }) => (
                    <FormItem> <FormLabel>Economy Price (LKR)</FormLabel> <FormControl>
                        <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''}
                        onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? null : (isNaN(parseFloat(valStr)) ? null : parseFloat(valStr))); }}/>
                    </FormControl> <FormMessage /> </FormItem>
                    )} />
                    <FormField control={weightRateForm.control} name="docExpressPrice" render={({ field }) => (
                    <FormItem> <FormLabel>Express Price (LKR)</FormLabel> <FormControl>
                        <Input type="number" step="0.01" placeholder="Optional" {...field} value={field.value ?? ''}
                        onChange={e => { const valStr = e.target.value; field.onChange(valStr === '' ? null : (isNaN(parseFloat(valStr)) ? null : parseFloat(valStr))); }}/>
                    </FormControl> <FormMessage /> </FormItem>
                    )} />
                </div>
                 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <FormField control={weightRateForm.control} name="isDocEconomyEnabled" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 sm:p-3 shadow-sm flex-1 min-w-[180px] sm:min-w-[200px]">
                            <div className="space-y-0.5 mr-2 sm:mr-4"> <FormLabel className="text-sm">Enable Economy</FormLabel> <ShadFormDescription className="text-xs">Document economy.</ShadFormDescription> </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                    <FormField control={weightRateForm.control} name="isDocExpressEnabled" render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-2 sm:p-3 shadow-sm flex-1 min-w-[180px] sm:min-w-[200px]">
                            <div className="space-y-0.5 mr-2 sm:mr-4"> <FormLabel className="text-sm">Enable Express</FormLabel> <ShadFormDescription className="text-xs">Document express.</ShadFormDescription> </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                {editingWeightRate && <Button type="button" variant="outline" onClick={() => { setEditingWeightRate(null); weightRateForm.reset({
                    weightLabel: '', weightValue: '' as any,
                    ndEconomyPrice: null, ndExpressPrice: null, isNdEconomyEnabled: true, isNdExpressEnabled: true,
                    docEconomyPrice: null, docExpressPrice: null, isDocEconomyEnabled: true, isDocExpressEnabled: true
                }); }} className="w-full sm:w-auto">Cancel Edit</Button>}
                <Button type="submit" disabled={isSubmittingWeight} className="w-full sm:w-auto">
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
              <div className="overflow-x-auto max-h-[300px] sm:max-h-[400px] md:max-h-[500px]">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-2 py-2 text-xs sticky left-0 bg-card z-10 whitespace-nowrap">Label</TableHead>
                      <TableHead className="px-2 py-2 text-xs text-center whitespace-nowrap">Value (kg)</TableHead>
                      <TableHead className="px-2 py-2 text-xs text-center whitespace-nowrap">ND Econ. (LKR)</TableHead>
                      <TableHead className="px-2 py-2 text-xs text-center whitespace-nowrap">ND Exp. (LKR)</TableHead>
                      <TableHead className="px-2 py-2 text-xs text-center whitespace-nowrap">Doc Econ. (LKR)</TableHead>
                      <TableHead className="px-2 py-2 text-xs text-center whitespace-nowrap">Doc Exp. (LKR)</TableHead>
                      <TableHead className="px-2 py-2 text-xs text-right sticky right-0 bg-card z-10 whitespace-nowrap">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentWeights.map((wr) => (
                    <TableRow key={wr.id}>
                      <TableCell className="font-medium px-2 py-2 text-xs sticky left-0 bg-card z-0 whitespace-nowrap">{wr.weightLabel}</TableCell>
                      <TableCell className="px-2 py-2 text-xs text-center whitespace-nowrap">{wr.weightValue}</TableCell>
                      <TableCell className="px-2 py-2 text-xs text-center whitespace-nowrap">{wr.isNdEconomyEnabled ? (wr.ndEconomyPrice !== null && wr.ndEconomyPrice !== undefined ? wr.ndEconomyPrice : <XCircle className="h-3 w-3 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Off</span>}</TableCell>
                      <TableCell className="px-2 py-2 text-xs text-center whitespace-nowrap">{wr.isNdExpressEnabled ? (wr.ndExpressPrice !== null && wr.ndExpressPrice !== undefined ? wr.ndExpressPrice : <XCircle className="h-3 w-3 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Off</span>}</TableCell>
                      <TableCell className="px-2 py-2 text-xs text-center whitespace-nowrap">{wr.isDocEconomyEnabled ? (wr.docEconomyPrice !== null && wr.docEconomyPrice !== undefined ? wr.docEconomyPrice : <XCircle className="h-3 w-3 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Off</span>}</TableCell>
                      <TableCell className="px-2 py-2 text-xs text-center whitespace-nowrap">{wr.isDocExpressEnabled ? (wr.docExpressPrice !== null && wr.docExpressPrice !== undefined ? wr.docExpressPrice : <XCircle className="h-3 w-3 text-muted-foreground mx-auto"/>) : <span className="text-xs text-muted-foreground">Off</span>}</TableCell>
                      <TableCell className="px-2 py-2 text-xs text-right space-x-1 sticky right-0 bg-card z-0 whitespace-nowrap">
                        <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7" onClick={() => handleEditWeightClick(wr)}><Edit3 className="h-3 w-3 sm:h-4 sm:w-4"/></Button>
                        <Dialog open={!!weightRateToDelete && weightRateToDelete.id === wr.id} onOpenChange={(isOpen) => !isOpen && setWeightRateToDelete(null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-7 sm:w-7 text-destructive hover:text-destructive" onClick={() => setWeightRateToDelete(wr)}><Trash2 className="h-3 w-3 sm:h-4 sm:w-4"/></Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Delete Weight Rate</DialogTitle>
                              <DialogDescriptionComponent>Are you sure you want to delete the weight rate: <strong>{weightRateToDelete?.weightLabel}</strong> for <strong>{selectedCountryForWeights?.name}</strong>? This is irreversible.</DialogDescriptionComponent>
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

