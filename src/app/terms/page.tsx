
import PageHeader from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';

export default function TermsAndConditionsPage() {
  return (
    <div className="space-y-12 opacity-0 animate-fadeInUp container mx-auto px-4 py-8">
      <PageHeader
        title="Terms and Conditions"
        description="Please read our terms of carriage carefully."
      />
      <Card className="max-w-4xl mx-auto">
        <CardContent className="pt-6 space-y-4 text-foreground/90">
          <p className="font-semibold text-accent">
            These conditions of carriage EXCLUDE LIABILITY on the part of Fly Cargo Lanka and its employees or agents for loss, damage and delay in certain circumstances, LIMIT LIABILITY to stated amounts where liability is accepted and REQUIRE NOTICE OF CLAIMS within strict time limits. Senders should note these conditions carefully.
          </p>

          <h3 className="text-xl font-semibold text-accent pt-4">Rates and Quotations</h3>
          <p>
            Rates and service quotations by employees and agents of Fly Cargo Lanka will be based upon information provided by the sender but final rates and service may vary based upon the shipment actually tendered and the application of these conditions. Fly Cargo Lanka is not liable for, nor will any adjustment, refund or credit of any kind be made, as a result of any discrepancy in any rate or service quotation made prior to the tender of the shipment and the rates, and other charges invoiced to the customer.
          </p>

          <h3 className="text-xl font-semibold text-accent pt-4">Dimensional Weight</h3>
          <p>
            Charges may be assessed based on dimensional weight. Dimensional weight is determined by multiplying a package's length x height x width (all in centimetres) and dividing by 5000 or such other number as specified by Fly Cargo Lanka from time to time on fedex.com. If the result exceeds the actual weight, additional charges may be assessed based on the dimensional weight. There is no limit on the aggregate weight of a multiple piece shipment provided each individual package within the shipment does not exceed the per package weight limit specified for the destination. For the bulk shipments require advance arrangement with Fly Cargo Lanka. Details are available upon request.
          </p>

          <h3 className="text-xl font-semibold text-accent pt-4">Unacceptable Items for Carriage</h3>
          <p>The following items are not acceptable for carriage to any destination at any circumstance unless otherwise agreed to by Fly Cargo Lanka.</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Money (coins, cash, currency paper money and negotiable instruments equivalent to cash such as endorsed stocks, bonds and cash letters).</li>
            <li>Explosives fireworks and other items of an incendiary or flammable nature.</li>
            <li>Human corpses, organs or body parts, human and animal embryos, cremated or disinterred human remains.</li>
            <li>Firearms, weaponry, ammunition and their parts.</li>
            <li>Foodstuffs, perishable food articles and beverages requiring refrigeration or other environmental control.</li>
            <li>Hazardous waste, including, but not limited to, used hypodermic needles and/or syringes or medical waste.</li>
            <li>Shipments requiring to obtain any special license or permit for transportation, importation or exportation.</li>
            <li>Shipments the carriage, importation or exportation of which is prohibited by any law, statute or regulation.</li>
            <li>Packages that are wet, leaking or emit an odor of any kind.</li>
          </ul>

          <h3 className="text-xl font-semibold text-accent pt-4">Packaging and Marking</h3>
           <ul className="list-disc pl-6 space-y-1">
            <li>Packages that are wrapped in kraft paper.</li>
            <li>Each package within a shipment must be legibly and durably marked with the full name and complete postal address with the PIN code and telephone number of both the shipper and the recipient. Fly Cargo Lanka shall not be liable for non-delivery on account of incomplete or erroneous address being furnished by the shipper. Further, customer is fully liable to inform us if any erroneous in tracking number not later than twenty-four (24) hours since receive the tracking number.</li>
           </ul>

          <h3 className="text-xl font-semibold text-accent pt-4">Additional Conditions</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Rates will be updated in each month based on US dollar and Sri Lanka rupee conversion.</li>
            <li>Non commercial items such as consumables and herbal remedies has high clearance risk in certain countries like Australia and Japan. Hence, an extra vigilance and support from the receiver end will be required.</li>
            <li>An additional charge will be applicable for large packages & shipments exceeding either: weight/length & dimension. Maximum Weight and Size Limits (per piece): Weight 70 kg, Length 274 cm, Size 419 cm in length and girth (2 x width) + (2 x height)) combined.</li>
            <li>Fly Cargo Lanka is not liable for any shipments that is been held at the destination country due to customs inspections and releasing them. Also, the charges shown in the calculator is only the shipping fee and does not include any duty charges or any other charges enforced in the destination country. These charges needs to be bared by the receiver of the parcel.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
