// Home page content. Every claim here comes from the business's own site: the About page, the FAQ, or a product description.

/** What to cook, and rices whose own description names that dish. */
export const dishes = [
  { name: 'Biryani', text: 'Long grains that stay separate and fluffy.', rice: ['double-chabi-golden-sella-basmati', 'gauri-old', 'inaya-1121-lotus', 'rani-sahiba-old'] },
  { name: 'Pulao', text: 'Light, fragrant and easy to serve.', rice: ['1060-basmati-rice', 'hari-patti-natural', 'lahori-gate-rozana', 'punjab-ratan'] },
  { name: 'Everyday meals', text: 'Soft, dependable rice for dal-chawal.', rice: ['lahori-gate-rozana', 'south-sona-mansoori-rice', 'kolam-raw', 'parmal-no-1'] },
  { name: 'Idli and dosa', text: 'The right starch for batter.', rice: ['idli-rice', 'dosa-rice', 'south-sona-mansoori-rice', 'aeroplane-sona-masoori'] },
  { name: 'Khichdi', text: 'Soft grains that cook down well.', rice: ['kolam-raw', 'hari-patti-mini-mogra', 'patanjali-mini-mogra-blue', 'inaya-enjoy-rice'] },
  { name: 'Kheer and payesh', text: 'Small, fragrant and creamy.', rice: ['gobindobhog-premium-red-rose', 'gobindobhog-broken'] },
  { name: 'Kerala meals', text: 'Traditional red matta rice.', rice: ['pavizham-wadi-matta-rice', 'pavizham-short-matta-rice'] },
];

/** Average grain length in millimetres, before and after cooking, as printed in each product's description. */
export const growth = [
  { slug: 'delhi-pasand-daily', name: 'Delhi Pasand Daily', raw: 7.45, cooked: 20.86 },
  { slug: 'delhi-pasand-light', name: 'Delhi Pasand Light', raw: 6.75, cooked: 14.5 },
  { slug: 'delhi-pasand-aabha', name: 'Delhi Pasand Aabha', raw: 5.9, cooked: 13 },
  { slug: 'delhi-pasand-first-choise', name: 'Delhi Pasand First Choice', raw: 5.4, cooked: 12 },
  { slug: 'delhi-pasand-easy', name: 'Delhi Pasand Easy', raw: 4.85, cooked: 10 },
];

export const numbers = [
  { big: '50+', small: 'years in rice' },
  { big: '150+', small: 'varieties in our store' },
  { big: '5,000+', small: 'retail customers' },
  { big: '2', small: 'stores, Gurugram and Sohna' },
];

export const questions = [
  { q: 'Which rice should I choose for biryani?', a: 'For dum biryani, choose 1121 basmati. The grains grow very long and stay separate. For a softer, everyday biryani, traditional basmati works well.' },
  { q: 'How should I store rice?', a: 'Keep it in an airtight container, in a cool, dry place, away from moisture and strong smells.' },
  { q: 'How long does rice stay fresh?', a: 'Aged basmati keeps well for 12 to 18 months, and its aroma deepens with time. Kala Namak and Gobindobhog are best within 9 to 12 months. Rose Matta is best within 6 months.' },
  { q: 'Can I buy in bulk?', a: 'Yes. We supply homes, restaurants and shops, with special pricing on bulk orders. Please call us or visit the store.' },
  { q: 'What makes your rice different?', a: 'We look for named rice from the place it belongs to: Kala Namak from Uttar Pradesh, Gobindobhog from West Bengal, Matta from Kerala, Ambemohar from Maharashtra, Katarni from Bihar.' },
];
