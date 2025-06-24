
"use client";

import { useState, type ChangeEvent, type FC } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, writeBatch, serverTimestamp, setDoc } from 'firebase/firestore';

import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UploadCloud, Download, Loader2, AlertTriangle, DatabaseZap, Check, X } from 'lucide-react';

interface ParsedRow {
  country: string;
  weightLabel: string;
  weightValue: number;
  ndEconomyPrice: number | null;
  ndExpressPrice: number | null;
  docEconomyPrice: number | null;
  docExpressPrice: number | null;
  _rowNumber: number;
  _error?: string;
}

const CSV_TEMPLATE_HEADERS = "Country,WeightLabel,WeightValue,ND_EconomyPrice,ND_ExpressPrice,Doc_EconomyPrice,Doc_ExpressPrice";
const CSV_TEMPLATE_EXAMPLE_ROW = "United States,0.5 kg,0.5,10,20,8,15";
const CSV_TEMPLATE = `${CSV_TEMPLATE_HEADERS}\n${CSV_TEMPLATE_EXAMPLE_ROW}`;

export default function ImportRatesPage() {
  const { toast } = useToast();
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.href) {
      URL.revokeObjectURL(link.href);
    }
    link.href = URL.createObjectURL(blob);
    link.download = "shipping_rates_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setError(null);
    setParsedData([]);

    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length) {
          setError(`Error parsing CSV: ${results.errors[0].message}`);
          setIsParsing(false);
          return;
        }
        
        const data = results.data.map((row, index) => {
          const rowNumber = index + 2; // 1 for header, 1 for 0-index
          const country = row.Country?.trim();
          const weightLabel = row.WeightLabel?.trim();
          const weightValue = parseFloat(row.WeightValue);

          let validationError: string | undefined;
          if (!country) validationError = "Country is missing.";
          else if (!weightLabel) validationError = "WeightLabel is missing.";
          else if (isNaN(weightValue) || weightValue <= 0) validationError = "WeightValue must be a positive number.";

          return {
            country: country || '',
            weightLabel: weightLabel || '',
            weightValue: weightValue || 0,
            ndEconomyPrice: row.ND_EconomyPrice ? parseFloat(row.ND_EconomyPrice) : null,
            ndExpressPrice: row.ND_ExpressPrice ? parseFloat(row.ND_ExpressPrice) : null,
            docEconomyPrice: row.Doc_EconomyPrice ? parseFloat(row.Doc_EconomyPrice) : null,
            docExpressPrice: row.Doc_ExpressPrice ? parseFloat(row.Doc_ExpressPrice) : null,
            _rowNumber: rowNumber,
            _error: validationError,
          };
        });

        setParsedData(data);
        setIsParsing(false);
      },
      error: (err) => {
        setError(err.message);
        setIsParsing(false);
      }
    });
  };

  const handleSeedDatabase = async () => {
    if (parsedData.some(row => row._error)) {
        toast({
            title: "Validation Error",
            description: "Please fix the errors in the CSV file before seeding.",
            variant: "destructive"
        });
        return;
    }
    
    setIsSeeding(true);
    
    const groupedByCountry: Record<string, ParsedRow[]> = parsedData.reduce((acc, row) => {
      if (!acc[row.country]) {
        acc[row.country] = [];
      }
      acc[row.country].push(row);
      return acc;
    }, {} as Record<string, ParsedRow[]>);

    try {
      const countriesRef = collection(db, 'shipping_rates');
      
      for (const countryName in groupedByCountry) {
        toast({ title: `Processing: ${countryName}...`, description: "Finding existing rates..."});
        
        const q = query(countriesRef, where('name', '==', countryName));
        const querySnapshot = await getDocs(q);

        let countryDocRef;
        const batch = writeBatch(db);

        if (!querySnapshot.empty) {
          // Country exists, replace its weights
          const existingDoc = querySnapshot.docs[0];
          countryDocRef = existingDoc.ref;

          // Delete all existing weights for this country
          const weightsSnapshot = await getDocs(collection(countryDocRef, 'weights'));
          weightsSnapshot.docs.forEach(d => batch.delete(d.ref));
        } else {
          // New country, create it
          countryDocRef = doc(collection(db, 'shipping_rates'));
          batch.set(countryDocRef, { name: countryName, createdAt: serverTimestamp() });
        }
        
        // Add new weights
        const weightsForCountry = groupedByCountry[countryName];
        for (const weightData of weightsForCountry) {
          const newWeightRef = doc(collection(countryDocRef, 'weights'));
          batch.set(newWeightRef, {
            weightLabel: weightData.weightLabel,
            weightValue: weightData.weightValue,
            ndEconomyPrice: weightData.ndEconomyPrice,
            ndExpressPrice: weightData.ndExpressPrice,
            docEconomyPrice: weightData.docEconomyPrice,
            docExpressPrice: weightData.docExpressPrice,
            isNdEconomyEnabled: weightData.ndEconomyPrice !== null,
            isNdExpressEnabled: weightData.ndExpressPrice !== null,
            isDocEconomyEnabled: weightData.docEconomyPrice !== null,
            isDocExpressEnabled: weightData.docExpressPrice !== null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
        
        await batch.commit();
        toast({ title: `Success!`, description: `Seeded ${weightsForCountry.length} weight rates for ${countryName}.`, variant: "default" });
      }
      
      toast({ title: "Database Seeding Complete", description: "All rates from the file have been processed.", variant: "default" });
      setParsedData([]);
      setFileName('');

    } catch (err: any) {
        console.error("Seeding error:", err);
        toast({ title: "Database Seeding Failed", description: err.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
        setIsSeeding(false);
    }
  };


  return (
    <div className="space-y-6 opacity-0 animate-fadeInUp">
      <Button asChild variant="outline">
        <Link href="/admin/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <PageHeader
        title="Import Shipping Rates"
        description="Bulk upload country shipping rates using a CSV file."
      />

      <Card>
        <CardHeader>
          <CardTitle>Instructions & Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            1. Download the CSV template. The headers are: <code className="font-mono bg-muted p-1 rounded">{CSV_TEMPLATE_HEADERS}</code>
          </p>
          <p className="text-sm text-muted-foreground">
            2. Fill the template with your data. Leave price fields blank for services that are not available.
          </p>
          <p className="text-sm text-muted-foreground">
            3. Upload the completed file, preview the data, and click "Seed Database". This will <strong className="text-destructive">replace</strong> all existing weights for the countries in your file.
          </p>
          <Button onClick={handleDownloadTemplate} variant="secondary">
            <Download className="mr-2 h-4 w-4" /> Download CSV Template
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>Select your completed CSV file to begin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="max-w-sm"/>
          {fileName && <p className="text-sm text-muted-foreground mt-2">Selected file: {fileName}</p>}
        </CardContent>
      </Card>

      {isParsing && <div className="flex justify-center items-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <p className="ml-2">Parsing file...</p></div>}
      
      {error && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
            <CardDescription>Review the parsed data below before seeding to the database. Rows with errors are highlighted in red.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] w-full border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Row</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>ND Econ.</TableHead>
                    <TableHead>ND Exp.</TableHead>
                    <TableHead>Doc Econ.</TableHead>
                    <TableHead>Doc Exp.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((row) => (
                    <TableRow key={row._rowNumber} className={row._error ? 'bg-destructive/20' : ''}>
                      <TableCell>{row._rowNumber}</TableCell>
                      <TableCell>{row.country}</TableCell>
                      <TableCell>{row.weightLabel} ({row.weightValue}kg)</TableCell>
                      <TableCell>{row.ndEconomyPrice ?? <X className="h-4 w-4 text-muted-foreground"/>}</TableCell>
                      <TableCell>{row.ndExpressPrice ?? <X className="h-4 w-4 text-muted-foreground"/>}</TableCell>
                      <TableCell>{row.docEconomyPrice ?? <X className="h-4 w-4 text-muted-foreground"/>}</TableCell>
                      <TableCell>{row.docExpressPrice ?? <X className="h-4 w-4 text-muted-foreground"/>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
             {parsedData.some(row => row._error) && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Validation Errors Found</AlertTitle>
                  <AlertDescription>
                    One or more rows in your CSV file have errors (e.g., missing Country or invalid WeightValue). Please correct the file and re-upload. The "Seed Database" button is disabled.
                  </AlertDescription>
                </Alert>
            )}
            <Button
              size="lg"
              className="mt-6 w-full sm:w-auto"
              onClick={handleSeedDatabase}
              disabled={isSeeding || parsedData.some(row => row._error)}
            >
              {isSeeding ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <DatabaseZap className="mr-2 h-5 w-5"/>}
              {isSeeding ? "Seeding..." : "Seed Database"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
