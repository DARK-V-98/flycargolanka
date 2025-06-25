
"use client";

import React from 'react';

// This component is no longer used.
// The new invoice system uses a public/invoice.html template.
const PrintableInvoice = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return <div ref={ref} style={{ display: 'none' }} />;
});

PrintableInvoice.displayName = 'PrintableInvoice';
export default PrintableInvoice;
