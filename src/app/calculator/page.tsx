
import PageHeader from '@/components/PageHeader';
import ShippingCalculatorForm from '@/components/ShippingCalculatorForm';

export default function CalculatorPage() {
  return (
    <div className="opacity-0 animate-fadeInUp">
      <PageHeader
        title="Shipping Cost Calculator"
        description="Get an estimate for your shipping costs. Select your destination, package type, service, and weight."
      />
      <ShippingCalculatorForm />
    </div>
  );
}
