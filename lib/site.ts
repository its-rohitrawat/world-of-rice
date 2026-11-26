// Business details, as published on the live site.
export const site = {
  name: 'Joy World of Rice',
  phone: '+91 98109 61282',
  hours: 'Monday to Friday, 9 AM to 7 PM',
  stores: [
    { place: 'Gurugram store', lines: ['603/13, Kabir Bhawan Chowk', 'Old Railway Road, Sector 8', 'Gurugram, Haryana 122001'] },
    { place: 'Sohna store', lines: ['Shop No. 6, near Signature Global Infinity', 'Dhunela, Sohna', 'Haryana 122103'] },
  ],
  // Digits only, with country code. Uses the business phone number; change it here if WhatsApp is on another one.
  whatsapp: '919810961282',
};

export const telLink = `tel:${site.phone.replace(/\s/g, '')}`;

export function whatsappLink(product?: string) {
  if (!site.whatsapp) return null;
  const text = product ? `Hello, I would like to know more about ${product}.` : 'Hello, I would like to know more about your rice.';
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}

export const mapLink = (lines: string[]) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.name}, ${lines.join(', ')}`)}`;
