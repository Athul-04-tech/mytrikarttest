/**
 * Single Source of Truth for Admin-Defined Category Attribute Schemas
 * 
 * CORE PLATFORM GOVERNANCE RULE:
 * Sellers NEVER free-type structured product attributes (RAM, Storage, Color, Size, etc.).
 * Sellers only SELECT from values that Admin has already configured for that category.
 */

export const ADMIN_CATEGORY_SCHEMAS = [
  {
    id: 'electronics-mobiles',
    mainCategory: 'Electronics',
    subCategory: 'Mobile Phones',
    displayName: 'Electronics → Mobile Phones',
    icon: 'Smartphone',
    defaultHsn: '85171300',
    defaultGst: 18,
    suggestedWeightKg: '0.22',
    suggestedDimensions: '16.5 x 7.8 x 0.9 cm',
    attributes: [
      {
        id: 'ram',
        name: 'RAM Capacity',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['4GB', '6GB', '8GB', '12GB', '16GB'],
        helpText: 'Select one or more RAM capacities for this smartphone model.'
      },
      {
        id: 'storage',
        name: 'Internal Storage',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['64GB', '128GB', '256GB', '512GB', '1TB'],
        helpText: 'Select one or more flash storage tiers.'
      },
      {
        id: 'color',
        name: 'Color Finish',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['Phantom Black', 'Starlight White', 'Royal Blue', 'Forest Green', 'Imperial Gold', 'Deep Titanium'],
        helpText: 'Official color variant name.'
      },
      {
        id: 'battery',
        name: 'Battery Capacity',
        type: 'number',
        unit: 'mAh',
        required: false,
        variationCapable: false,
        placeholder: 'e.g. 5000',
        helpText: 'Rated milliampere-hour battery capacity.'
      },
      {
        id: 'screenSize',
        name: 'Display Size',
        type: 'number',
        unit: 'inches',
        required: false,
        variationCapable: false,
        placeholder: 'e.g. 6.7',
        helpText: 'Diagonal screen size in inches.'
      },
      {
        id: 'is5G',
        name: '5G Dual SIM Support',
        type: 'boolean',
        required: false,
        variationCapable: false,
        helpText: 'Enable if device supports Sub-6GHz / mmWave 5G bands.'
      },
      {
        id: 'biometrics',
        name: 'Biometric Security',
        type: 'dropdown',
        required: false,
        variationCapable: false,
        values: ['In-Display Optical Fingerprint', 'Ultrasonic In-Display', 'Side-Mounted Fingerprint', '3D Facial Recognition'],
        helpText: 'Hardware biometric unlocking technology.'
      }
    ],
    sampleImages: [
      '/products/spatial_headphones_1786529304124.png',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'fashion-tshirts',
    mainCategory: 'Fashion',
    subCategory: "Men's T-Shirts",
    displayName: "Fashion → Men's T-Shirts",
    icon: 'Shirt',
    defaultHsn: '61091000',
    defaultGst: 5,
    suggestedWeightKg: '0.25',
    suggestedDimensions: '30 x 24 x 2 cm',
    attributes: [
      {
        id: 'size',
        name: 'Garment Size',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        helpText: 'Select all available standard sizes.'
      },
      {
        id: 'color',
        name: 'Fabric Color',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['Jet Black', 'Pure White', 'Navy Blue', 'Maroon Wine', 'Olive Green', 'Heather Grey', 'Crimson Red'],
        helpText: 'Standard color options for this apparel line.'
      },
      {
        id: 'material',
        name: 'Fabric Composition',
        type: 'dropdown',
        required: true,
        variationCapable: false,
        values: ['100% Organic Supima Cotton', 'Single Jersey 180 GSM Cotton', 'Polyester Dry-Fit', 'Cotton-Linen Blend', 'Bamboo Viscose'],
        helpText: 'Primary raw textile blend.'
      },
      {
        id: 'fit',
        name: 'Fit Style',
        type: 'dropdown',
        required: true,
        variationCapable: false,
        values: ['Regular Fit', 'Slim Fit', 'Oversized Streetwear', 'Athletic Tapered', 'Relaxed Boxy'],
        helpText: 'Silhouette pattern of the apparel.'
      },
      {
        id: 'sleeve',
        name: 'Sleeve Length',
        type: 'dropdown',
        required: false,
        variationCapable: false,
        values: ['Half Sleeve', 'Full Sleeve', 'Sleeveless', 'Raglan Quarter Sleeve'],
        helpText: 'Sleeve construction.'
      },
      {
        id: 'neckStyle',
        name: 'Neckline',
        type: 'dropdown',
        required: false,
        variationCapable: false,
        values: ['Crew Neck', 'V-Neck', 'Henley Collar', 'Polo Ribbed Collar', 'Mock Turtleneck'],
        helpText: 'Collar and neck opening style.'
      },
      {
        id: 'isPreShrunk',
        name: 'Bio-Washed & Pre-Shrunk',
        type: 'boolean',
        required: false,
        variationCapable: false,
        helpText: 'Treated with enzyme bio-wash to prevent dimensional shrinkage after washing.'
      }
    ],
    sampleImages: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'electronics-laptops',
    mainCategory: 'Electronics',
    subCategory: 'Laptops & Ultrabooks',
    displayName: 'Electronics → Laptops & Ultrabooks',
    icon: 'Laptop',
    defaultHsn: '84713010',
    defaultGst: 18,
    suggestedWeightKg: '1.45',
    suggestedDimensions: '32.5 x 22.8 x 1.6 cm',
    attributes: [
      {
        id: 'ram',
        name: 'System Memory (RAM)',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['8GB LPDDR5', '16GB LPDDR5X', '32GB DDR5 Dual-Channel', '64GB High-Speed DDR5'],
        helpText: 'Installed RAM configuration.'
      },
      {
        id: 'storage',
        name: 'Solid State Drive (SSD)',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['256GB PCIe 4.0 NVMe SSD', '512GB PCIe 4.0 NVMe SSD', '1TB Ultra-Fast Gen4 SSD', '2TB Gen4 Performance SSD'],
        helpText: 'Primary high-speed storage drive capacity.'
      },
      {
        id: 'color',
        name: 'Chassis Finish',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['Space Grey Anodized', 'Matte Carbon Black', 'Platinum Silver', 'Deep Midnight Blue'],
        helpText: 'CNC aluminum unibody color finish.'
      },
      {
        id: 'processor',
        name: 'Processor (CPU)',
        type: 'dropdown',
        required: true,
        variationCapable: false,
        values: ['Intel Core i5 13th Gen (10-Core)', 'Intel Core i7 13th Gen (14-Core)', 'Intel Core Ultra 7 (AI NPU)', 'AMD Ryzen 7 7840HS (8-Core/16-Thread)', 'Apple M3 Pro (12-Core CPU / 18-Core GPU)'],
        helpText: 'Main processing architecture.'
      },
      {
        id: 'screenSize',
        name: 'Display Screen Size',
        type: 'number',
        unit: 'inches',
        required: false,
        variationCapable: false,
        placeholder: 'e.g. 14.2',
        helpText: 'Diagonal OLED/IPS display size in inches.'
      },
      {
        id: 'hasDedicatedGpu',
        name: 'Dedicated Discrete GPU Included',
        type: 'boolean',
        required: false,
        variationCapable: false,
        helpText: 'Equipped with NVIDIA RTX or AMD Radeon dedicated graphics chip.'
      },
      {
        id: 'os',
        name: 'Operating System',
        type: 'dropdown',
        required: false,
        variationCapable: false,
        values: ['Windows 11 Home Lifetime', 'Windows 11 Pro 64-bit', 'macOS Sonoma Pre-installed', 'Ubuntu LTS Certified', 'DOS / No OS'],
        helpText: 'Pre-installed licensed operating system.'
      }
    ],
    sampleImages: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=600&q=80'
    ]
  },
  {
    id: 'luxury-bedding',
    mainCategory: 'Home & Living',
    subCategory: 'Luxury Bedding & Silk Linens',
    displayName: 'Home & Living → Luxury Bedding & Silk Linens',
    icon: 'Sparkles',
    defaultHsn: '63022100',
    defaultGst: 12,
    suggestedWeightKg: '1.20',
    suggestedDimensions: '40 x 30 x 8 cm',
    attributes: [
      {
        id: 'size',
        name: 'Bedding Dimensions',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['Single (60" x 90")', 'Queen (90" x 100")', 'King (108" x 108")', 'Super King (120" x 108")'],
        helpText: 'Mattress fitted standard size.'
      },
      {
        id: 'color',
        name: 'Royal Shade',
        type: 'dropdown',
        required: true,
        variationCapable: true,
        values: ['Ivory Cream', 'Royal Emerald Gold', 'Midnight Obsidian', 'Champagne Pearl', 'Dusty Rose'],
        helpText: 'Dye shade palette.'
      },
      {
        id: 'threadCount',
        name: 'Thread Count (TC)',
        type: 'dropdown',
        required: true,
        variationCapable: false,
        values: ['400 TC Egyptian Cotton', '600 TC Sateen Weave', '1000 TC Royal Lustre', '22 Momme 100% Mulberry Silk'],
        helpText: 'Thread density and yarn count.'
      },
      {
        id: 'isHypoallergenic',
        name: 'OEKO-TEX Certified Hypoallergenic',
        type: 'boolean',
        required: false,
        variationCapable: false,
        helpText: 'Tested for zero harmful chemicals and allergen resistance.'
      }
    ],
    sampleImages: [
      '/products/banarasi_silk_saree_1786529541618.png',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'
    ]
  }
];
