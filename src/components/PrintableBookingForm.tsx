
"use client";
// This component is no longer used as print functionality was removed.
// The file is kept minimal to avoid build issues if referenced, but should ideally be deleted.
import React from 'react';

const PrintableBookingForm = React.forwardRef<HTMLDivElement, any>((props, ref) => {
  return <div ref={ref} style={{ display: 'none' }} />;
});

PrintableBookingForm.displayName = 'PrintableBookingForm';
export default PrintableBookingForm;
