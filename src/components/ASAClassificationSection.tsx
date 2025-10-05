import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ASAClassificationSectionProps {
  selectedASA: string;
  onASAChange: (value: string) => void;
  notes?: string;
  onNotesChange?: (value: string) => void;
  showNotes?: boolean;
}

const asaClasses = [
  { value: 'I', description: 'Normal Healthy Patient' },
  { value: 'II', description: 'Mild Systemic Disease' },
  { value: 'III', description: 'Severe Systemic Disease Limiting Activity' },
  { value: 'IV', description: 'Severe Disease Constant Threat to Life' },
  { value: 'V', description: 'Moribund, Not Expected to Survive Without Operation' },
  { value: 'VI', description: 'Brain-Dead, Organ Donor' }
];

export const ASAClassificationSection: React.FC<ASAClassificationSectionProps> = ({
  selectedASA,
  onASAChange,
  notes,
  onNotesChange,
  showNotes = false
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 mb-3">ASA Physical Status Classification</h3>
        
        {/* Display selected ASA classification prominently */}
        {selectedASA && (
          <Card className="mb-3 bg-blue-50 border-blue-200">
            <CardContent className="py-3 px-4">
              <p className="text-sm font-medium text-blue-900">
                Selected: ASA {selectedASA} - {asaClasses.find(c => c.value === selectedASA)?.description}
              </p>
            </CardContent>
          </Card>
        )}
        <div className="space-y-2">
          {asaClasses.map((asaClass) => (
            <div key={asaClass.value} className="flex items-start space-x-3">
              <Checkbox
                id={`asa-${asaClass.value}`}
                checked={selectedASA === asaClass.value}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onASAChange(asaClass.value);
                  } else {
                    onASAChange('');
                  }
                }}
              />
              <Label
                htmlFor={`asa-${asaClass.value}`}
                className="flex-1 cursor-pointer text-sm"
              >
                <span className="font-medium">ASA {asaClass.value}:</span>{' '}
                <span className="text-gray-600">{asaClass.description}</span>
              </Label>
            </div>
          ))}
        </div>
      </div>
      
      {showNotes && (
        <div>
          <Label htmlFor="asa-notes" className="text-sm font-medium text-gray-700 mb-2">
            Additional Notes (optional)
          </Label>
          <Textarea
            id="asa-notes"
            value={notes || ''}
            onChange={(e) => onNotesChange?.(e.target.value)}
            placeholder="Any additional ASA-related notes..."
            className="w-full h-20 text-sm"
          />
        </div>
      )}
    </div>
  );
};