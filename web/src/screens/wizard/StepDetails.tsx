import { useApp } from '../../state/AppContext';
import { PROPERTY_TYPES } from '../../types';
import { Chips, Field, SelectField, TextField } from '../../components/primitives';

const isResidentialType = (type: string) =>
  type === 'Apartment' || type === 'Villa' || type === 'House';

export default function StepDetails({ showErrors }: { showErrors: boolean }) {
  const { draft, updateDetails } = useApp();

  if (!draft) return null;
  const details = draft.details;

  const nameError = showErrors && !details.name.trim() ? 'Enter a property name' : undefined;
  const typeError = showErrors && !details.type ? 'Choose a property type' : undefined;

  return (
    <div className="page" style={{ paddingTop: 16 }}>
        <div className="sec-head">
          <span>Property</span>
        </div>
        <TextField
          label="Property name"
          required
          value={details.name}
          placeholder="Sai Heights"
          error={nameError}
          onChange={(value) => updateDetails({ name: value })}
        />

        <Field label="Property type" required error={typeError}>
          <Chips
            label="Property type"
            options={PROPERTY_TYPES}
            selected={details.type}
            onSelect={(value) => updateDetails({ type: value as typeof details.type })}
          />
        </Field>

        {isResidentialType(details.type) && (
          <div className="field-grid">
            <TextField
              label="Apartment type"
              value={details.apartmentType}
              placeholder="2BHK"
              onChange={(value) => updateDetails({ apartmentType: value })}
            />
            <TextField
              label="Bedrooms"
              value={details.bedrooms}
              inputMode="numeric"
              placeholder="2"
              onChange={(value) => updateDetails({ bedrooms: value })}
            />
          </div>
        )}

        {details.type === 'PG / Hostel' && (
          <div className="field-grid">
            <SelectField
              label="Accommodation type"
              value={details.accommodationType || 'Co-living'}
              options={['Co-living', 'Girls', 'Boys', 'Working professionals'].map((value) => ({
                value,
                label: value,
              }))}
              onChange={(value) => updateDetails({ accommodationType: value })}
            />
            <TextField
              label="Capacity"
              value={details.capacity}
              inputMode="numeric"
              placeholder="Optional"
              onChange={(value) => updateDetails({ capacity: value })}
            />
          </div>
        )}

        <div className="sec-head" style={{ marginTop: 18 }}>
          <span>Address</span>
        </div>
        <TextField
          label="Address line 1"
          value={details.address1}
          placeholder="Plot 14, Baner Road"
          onChange={(value) => updateDetails({ address1: value })}
        />
        <TextField
          label="Address line 2"
          value={details.address2}
          placeholder="Near Baner Gaon bus stop"
          onChange={(value) => updateDetails({ address2: value })}
        />
        <div className="field-grid">
          <TextField
            label="Locality / area"
            value={details.locality}
            placeholder="Baner"
            onChange={(value) => updateDetails({ locality: value })}
          />
          <TextField
            label="PIN code"
            value={details.pin}
            inputMode="numeric"
            maxLength={6}
            placeholder="411045"
            onChange={(value) => updateDetails({ pin: value.replace(/\D/g, '') })}
          />
        </div>
        <div className="field-grid">
          <TextField
            label="State"
            value={details.state}
            placeholder="Maharashtra"
            onChange={(value) => updateDetails({ state: value })}
          />
          <TextField
            label="City"
            value={details.city}
            placeholder="Pune"
            onChange={(value) => updateDetails({ city: value })}
          />
        </div>

        <div style={{ height: 22 }} />
    </div>
  );
}
