import React from 'react';
import { 
  Sliders, 
  Sparkles, 
  HelpCircle, 
  PlusCircle, 
  Check, 
  CheckCircle2, 
  Info,
  ShieldCheck,
  Loader2 
} from 'lucide-react';

export default function DynamicAttributesSection({
  selectedCategory,
  categoryAttributes = [],
  isLoadingAttributes = false,
  attributeValues,
  onChangeAttribute,
  onRequestNewValue
}) {
  if (!selectedCategory) return null;

  // Normalize attributes list (either passed from backend or selectedCategory.attributes)
  const attributesList = (categoryAttributes && categoryAttributes.length > 0)
    ? categoryAttributes
    : (selectedCategory.attributes || []);

  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative animate-fadeIn">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C]">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
              2. Standardized Specifications & Attributes
            </h2>
            <p className="text-xs text-[#6B6058]">
              Admin-defined schema for <strong className="text-[#FA661C]">{selectedCategory.name || selectedCategory.displayName}</strong>. Select authorized values.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[10px] font-bold text-[#FA661C] bg-[#FFF8F2] border border-[#FF811A]/50 px-3 py-1 rounded-full self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FF811A]" />
          <span>Admin Data Governance Active</span>
        </div>
      </div>

      {isLoadingAttributes ? (
        <div className="flex items-center space-x-2 text-xs font-bold text-[#FA661C] py-8 justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-[#FA661C]" />
          <span>Loading attributes for category...</span>
        </div>
      ) : attributesList.length === 0 ? (
        <div className="py-8 text-center text-xs text-[#6B6058]">
          No attributes configured for this category yet.
        </div>
      ) : (
        /* Dynamic Attributes Grid */
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {attributesList.map((attr) => {
            // Standardize field names across backend API and mock formats
            const attrId = attr.id;
            const name = attr.attribute_name || attr.name;
            const fieldType = attr.field_type || attr.type || 'text';
            const isRequired = attr.is_required !== undefined ? attr.is_required : attr.required;
            const isVariationCapable = attr.is_variation_capable !== undefined ? attr.is_variation_capable : attr.variationCapable;
            const allowedValues = attr.allowed_values || attr.values || [];

            const currentValue = attributeValues[attrId];

            return (
              <div 
                key={attrId}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isVariationCapable 
                    ? 'bg-[#FFFFFF]/60 border-[#FF811A]/40 hover:border-[#FF811A]' 
                    : 'bg-[#FFFFFF]/30 border-[#EAE3DC] hover:border-[#FA661C]/40'
                }`}
              >
                
                {/* Field Label + Badges + Request Value Link */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <label className="text-xs font-extrabold text-[#FA661C]">
                        {name}
                      </label>
                      {isRequired && (
                        <span className="text-[#D7263D] font-bold text-xs" title="Required field">*</span>
                      )}
                      {isVariationCapable && (
                        <span className="text-[9px] font-black uppercase bg-[#FA661C] text-[#FF811A] px-1.5 py-0.2 rounded tracking-wider">
                          Variant-Capable
                        </span>
                      )}
                    </div>
                    {attr.helpText && (
                      <p className="text-[10px] text-[#6B6058] mt-0.5">
                        {attr.helpText}
                      </p>
                    )}
                  </div>

                  {/* "Request New Value" Link for Dropdowns */}
                  {fieldType === 'dropdown' && (
                    <button
                      type="button"
                      onClick={() => onRequestNewValue && onRequestNewValue(attr)}
                      className="text-[10px] font-bold text-[#FF811A] hover:text-[#FA661C] hover:underline flex items-center space-x-1 shrink-0 cursor-pointer"
                    >
                      <PlusCircle className="w-3 h-3" />
                      <span>Request Option</span>
                    </button>
                  )}
                </div>

                {/* RENDER DYNAMIC FIELD TYPE */}
                
                {/* 1. Dropdown Type */}
                {fieldType === 'dropdown' && (
                  <div className="mt-3">
                    {isVariationCapable ? (
                      // Multi-select chip group for variation-capable attributes
                      <div>
                        <span className="text-[10px] font-semibold text-[#6B6058] block mb-2">
                          Select options (generates variants):
                        </span>
                        {allowedValues.length === 0 ? (
                          <span className="text-[11px] text-[#6B6058] italic">No values defined</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {allowedValues.map((optionVal) => {
                              const valString = typeof optionVal === 'string' ? optionVal : (optionVal.value || optionVal.name);
                              const isSelected = Array.isArray(currentValue) 
                                ? currentValue.includes(valString)
                                : currentValue === valString;

                              return (
                                <button
                                  key={valString}
                                  type="button"
                                  onClick={() => {
                                    const currentArray = Array.isArray(currentValue) ? [...currentValue] : (currentValue ? [currentValue] : []);
                                    const updated = isSelected 
                                      ? currentArray.filter(v => v !== valString)
                                      : [...currentArray, valString];
                                    onChangeAttribute(attrId, updated);
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer btn-interactive ${
                                    isSelected
                                      ? 'bg-[#FA661C] text-[#FFFFFF] border border-[#FA661C] shadow-2xs ring-1 ring-[#FF811A]'
                                      : 'bg-white text-[#FA661C] border border-[#EAE3DC] hover:border-[#FA661C] hover:bg-[#FFF3EC]'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-[#FF811A]" />}
                                  <span>{valString}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Single select chip group for non-variation dropdowns
                      <div className="flex flex-wrap gap-2">
                        {allowedValues.map((optionVal) => {
                          const valString = typeof optionVal === 'string' ? optionVal : (optionVal.value || optionVal.name);
                          const isSelected = currentValue === valString;

                          return (
                            <button
                              key={valString}
                              type="button"
                              onClick={() => onChangeAttribute(attrId, valString)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer btn-interactive ${
                                isSelected
                                  ? 'bg-[#FA661C] text-[#FFFFFF] border border-[#FA661C] shadow-2xs'
                                  : 'bg-white text-[#FA661C] border border-[#EAE3DC] hover:border-[#FA661C] hover:bg-[#FFF3EC]'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-[#FF811A]" />}
                              <span>{valString}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Text Type */}
                {fieldType === 'text' && (
                  <div className="mt-3">
                    <input
                      type="text"
                      value={currentValue || ''}
                      onChange={(e) => onChangeAttribute(attrId, e.target.value)}
                      placeholder={attr.placeholder || `Enter ${name}`}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
                    />
                  </div>
                )}

                {/* 3. Number Type */}
                {fieldType === 'number' && (
                  <div className="mt-3 relative">
                    <input
                      type="number"
                      value={currentValue || ''}
                      onChange={(e) => onChangeAttribute(attrId, e.target.value)}
                      placeholder={attr.placeholder || 'Enter value'}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
                    />
                    {attr.unit && (
                      <span className="absolute right-3.5 top-2.5 text-xs font-extrabold text-[#6B6058] pointer-events-none">
                        {attr.unit}
                      </span>
                    )}
                  </div>
                )}

                {/* 4. Boolean Type */}
                {fieldType === 'boolean' && (
                  <div className="mt-3 flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#EAE3DC]">
                    <span className="text-xs font-bold text-[#FA661C]">
                      {currentValue ? 'Enabled (Yes)' : 'Disabled (No)'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onChangeAttribute(attrId, !currentValue)}
                      className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                        currentValue ? 'bg-[#FA661C]' : 'bg-[#EAE3DC]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-[#FFFFFF] absolute top-1 toggle-thumb-spring ${
                        currentValue ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </section>
  );
}

