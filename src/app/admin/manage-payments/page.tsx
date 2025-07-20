
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";

import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowLeft, Save, CreditCard } from 'lucide-react';

const SETTINGS_DOC_REF = doc(db, 'settings', 'payment');

interface PaymentSettings {
  isPayhereEnabled: boolean;
}

export default function ManagePaymentsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useState<PaymentSettings>({ isPayhereEnabled: true });
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            try {
                const docSnap = await getDoc(SETTINGS_DOC_REF);
                if (docSnap.exists()) {
                    setSettings(docSnap.data() as PaymentSettings);
                } else {
                    // If no settings exist, initialize with defaults
                    await setDoc(SETTINGS_DOC_REF, { isPayhereEnabled: true });
                }
            } catch (err) {
                console.error("Error fetching payment settings:", err);
                toast({ title: "Error", description: "Could not fetch payment settings.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, [toast]);

    const handleSaveSettings = async () => {
        setIsSubmitting(true);
        try {
            await setDoc(SETTINGS_DOC_REF, settings, { merge: true });
            toast({ title: "Success", description: "Payment settings have been updated." });
        } catch (err: any) {
            console.error("Error saving settings:", err);
            toast({ title: "Error", description: "Could not save payment settings.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading settings...</div>;
    }

    return (
        <div className="space-y-6 opacity-0 animate-fadeInUp">
            <Button asChild variant="outline">
                <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
            </Button>

            <PageHeader
                title="Manage Payment Gateways"
                description="Enable or disable payment options available to your customers."
            />

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Payhere Online Payments</CardTitle>
                    <CardDescription>
                        Turn the Payhere credit/debit card payment option on or off.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4 rounded-lg border p-4">
                        <CreditCard className="h-6 w-6 text-primary"/>
                        <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-none">
                                Enable Payhere
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Allow customers to pay online using cards.
                            </p>
                        </div>
                        <Switch
                            checked={settings.isPayhereEnabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, isPayhereEnabled: checked })}
                            aria-label="Toggle Payhere"
                            disabled={isSubmitting}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveSettings} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                        {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
