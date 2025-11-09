import { useState } from 'react';
import type { FormEvent } from 'react';
import type { RestaurantSearch } from '../types/Restaurant';
import './SearchForm.css';

/**
 * Props interface for SearchForm component
 * @param onSubmit - Callback function that receives the search data when form is submitted
 */
interface SearchFormProps {
  onSubmit: (searchData: RestaurantSearch) => void;
}

/**
 * SearchForm Component
 * A form component that allows users to search for restaurants with various filters.
 * Handles required fields (date, time, number of guests) and optional filters
 * (location, cuisine, budget, rating).
 * 
 * @param onSubmit - Function that will be called with the search data when form is submitted
 */
export default function SearchForm({ onSubmit }: SearchFormProps) {
  /**
   * State management for form data
   * useState hook stores all form field values in a single object.
   * Initializes with empty/default values:
   * - Required fields: date, time, numGuests (must have values)
   * - Optional fields: budget, cuisine, location, rating (can be undefined/empty)
   */
  const [formData, setFormData] = useState<RestaurantSearch>({
    date: '',
    time: '',
    numGuests: 1,
    budget: undefined,
    cuisine: '',
    location: '',
    rating: undefined,
  });

  /**
   * Time period options for the toggle
   * Users can select common meal periods instead of exact time
   */
  const timePeriods = [
    { label: 'ארוחת בוקר', value: '07:00' },
    { label: 'ארוחת צהריים', value: '12:00' },
    { label: 'ארוחת ערב', value: '18:00' },
    { label: 'לילה מאוחר', value: '21:00' },
  ];

  /**
   * Budget options for toggle buttons
   */
  const budgetOptions: ('$' | '$$' | '$$$' | '$$$$')[] = ['$', '$$', '$$$', '$$$$'];

  /**
   * handleSubmit Function
   * Called when the user submits the form (clicks the submit button or presses Enter).
   * 
   * What it does:
   * 1. Prevents the default browser form submission behavior (which would reload the page)
   * 2. Creates a clean search data object starting with only required fields
   * 3. Conditionally adds optional fields only if they have actual values
   *    - Trims whitespace from text fields (cuisine, location) to avoid empty strings
   *    - Only includes fields that are not undefined/empty
   * 4. Passes the cleaned search data to the parent component via the onSubmit callback
   * 
   * @param e - FormEvent from the form submission
   */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    // Prevent the default form submission which would reload the page
    e.preventDefault();
    
    // Start with required fields - these must always be included
    const searchData: RestaurantSearch = {
      date: formData.date,
      time: formData.time,
      numGuests: formData.numGuests,
    };

    // Only add optional fields if they have values
    // This keeps the search data clean without empty/undefined properties
    if (formData.budget) {
      searchData.budget = formData.budget;
    }
    // trim() removes whitespace - only add if there's actual text content
    if (formData.cuisine?.trim()) {
      searchData.cuisine = formData.cuisine.trim();
    }
    if (formData.location?.trim()) {
      searchData.location = formData.location.trim();
    }
    // Check for undefined specifically since 0 could be a valid value
    if (formData.rating !== undefined) {
      searchData.rating = formData.rating;
    }

    // Pass the cleaned search data to the parent component
    onSubmit(searchData);
  };

  /**
   * handleChange Function
   * A reusable function that updates a specific field in the form state.
   * Used by all input fields to keep the form data in sync with user input.
   * 
   * How it works:
   * 1. Takes the field name (key from RestaurantSearch interface) and new value
   * 2. Uses setFormData with a function that receives the previous state
   * 3. Returns a new object with all previous values spread, plus the updated field
   * 4. This ensures React knows the state changed and re-renders the component
   * 
   * @param field - The name of the form field to update (must be a key from RestaurantSearch)
   * @param value - The new value for that field (can be string or number)
   */
  const handleChange = (field: keyof RestaurantSearch, value: string | number) => {
    // Update form state by merging previous state with the changed field
    // Using functional update ensures we have the latest state
    setFormData((prev) => ({
      ...prev,           // Keep all existing fields
      [field]: value,    // Update only the specified field with new value
    }));
  };

  /**
   * JSX Return
   * Renders the form UI with all input fields.
   * Each input is a "controlled component" - its value comes from state (formData)
   * and changes update state (via onChange handlers).
   * This creates a two-way data binding: state ↔ UI
   */
  return (
    // onSubmit event: Triggers handleSubmit when form is submitted
    <form onSubmit={handleSubmit} className="search-form">
      <h2>חפש מסעדה</h2>
      
      {/* Three-column grid for Date, Time, and Guests */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="date">
            תאריך <span className="required-asterisk">*</span>
          </label>
          <input
            type="date"
            id="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            required
            className="date-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="time">
            שעה <span className="required-asterisk">*</span>
          </label>
          <div className="time-toggle">
            {timePeriods.map((period) => (
              <button
                key={period.value}
                type="button"
                className={`time-option ${formData.time === period.value ? 'active' : ''}`}
                onClick={() => handleChange('time', period.value)}
              >
                {period.label}
              </button>
            ))}
          </div>
          {/* Fallback time input for custom time selection */}
          <input
            type="time"
            id="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
            className="time-input-fallback"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="numGuests">
            מספר אורחים <span className="required-asterisk">*</span>
          </label>
          <select
            id="numGuests"
            value={formData.numGuests}
            onChange={(e) => handleChange('numGuests', parseInt(e.target.value))}
            required
            className="guests-select"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num === 1 ? 'אורח אחד' : `${num} אורחים`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="location">מיקום</label>
        <input
          type="text"
          id="location"
          placeholder="לדוגמה: תל אביב, ירושלים"
          value={formData.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="cuisine">סוג מטבח</label>
        <input
          type="text"
          id="cuisine"
          placeholder="לדוגמה: איטלקי, סיני, מקסיקני"
          value={formData.cuisine || ''}
          onChange={(e) => handleChange('cuisine', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor="budget">תקציב</label>
        <div className="budget-toggle">
          {budgetOptions.map((budget) => (
            <button
              key={budget}
              type="button"
              className={`budget-button ${formData.budget === budget ? 'active' : ''}`}
              onClick={() => handleChange('budget', budget)}
            >
              {budget}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="rating">דירוג</label>
        <div className="rating-stars">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              type="button"
              className={`star-button ${formData.rating !== undefined && star <= formData.rating ? 'filled' : ''}`}
              onClick={() => {
                // If clicking the same star that's already selected, deselect (set to undefined)
                if (formData.rating === star) {
                  setFormData((prev) => ({ ...prev, rating: undefined }));
                } else {
                  handleChange('rating', star);
                }
              }}
            >
              <span className="star-icon">★</span>
            </button>
          ))}
        </div>
      </div>

      <button type="submit" className="submit-button">
        <span className="search-icon">🔍</span>
        חפש מסעדות
      </button>
    </form>
  );
}

