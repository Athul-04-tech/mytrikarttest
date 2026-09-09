/**
 * Cartesian Product Variant Generator Utility
 * 
 * Takes dynamic multi-selected variation-capable attributes and computes
 * all possible permutations as structured, editable variant records.
 */

export function generateCartesianVariants(selectedAttributes, schemaAttributes, baseData = {}, existingVariants = []) {
  // 1. Identify all variation-capable attributes that have at least 1 selected value
  const variationEntries = [];
  
  if (schemaAttributes && selectedAttributes) {
    schemaAttributes.forEach(attr => {
      if ((attr.is_variation_capable ?? attr.variationCapable) && selectedAttributes[attr.id]) {
        const val = selectedAttributes[attr.id];
        const valArray = Array.isArray(val) ? val : (val ? [val] : []);
        if (valArray.length > 0) {
          variationEntries.push({
            attrId: attr.id,
            attrName: attr.attribute_name || attr.name,
            values: valArray
          });
        }
      }
    });
  }

  // Even one selected value represents a real variant combination.
  if (variationEntries.length === 0) return [];

  // 2. Real Cartesian Product Computation
  const valueArrays = variationEntries.map(e => e.values);
  const rawCartesian = valueArrays.reduce(
    (acc, curr) => acc.flatMap(d => curr.map(e => [...d, e])),
    [[]]
  );

  // 3. Map into full variant rows
  const brandCode = (baseData.brand || 'APEX').replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  const titleCode = (baseData.title || 'PROD').replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
  const baseMrp = parseFloat(baseData.mrp) || 9999;
  const basePrice = parseFloat(baseData.sellingPrice) || 4999;
  const baseStock = (baseData.stockQuantity === '' || baseData.stockQuantity == null) ? 0 : Number(baseData.stockQuantity);

  return rawCartesian.map((combinationValues, index) => {
    // Construct attribute mapping for this combination
    const combinationMap = {};
    const labelParts = [];
    const skuParts = [];

    combinationValues.forEach((val, idx) => {
      const attr = variationEntries[idx];
      combinationMap[attr.attrId] = val;
      labelParts.push(val);
      
      // Clean abbreviated SKU token
      const token = val.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase();
      skuParts.push(token);
    });

    const comboId = combinationValues.join('__');
    const autoSku = `SKU-${brandCode}-${titleCode}-${skuParts.join('-')}`;
    const combinationLabel = labelParts.join(' / ');

    // Check if seller had previously customized this exact variant combination
    const existing = existingVariants.find(v => v.comboId === comboId);

    if (existing) {
      return {
        ...existing,
        combinationLabel,
        combinationMap
      };
    }

    return {
      id: `VAR-${index + 1}-${Date.now().toString(36).substring(4)}`,
      comboId,
      sku: autoSku,
      combinationLabel,
      combinationMap,
      mrp: baseMrp,
      price: basePrice,
      stock: baseStock,
      isActive: true,
      image: baseData.coverImage || null
    };
  });
}
