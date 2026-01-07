import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook for form validation with real-time feedback
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @param {Object} options - Additional options
 * @returns {Object} Form validation state and methods
 */
const useFormValidation = (
	initialValues = {},
	validationRules = {},
	options = {},
) => {
	const {
		validateOnChange = true,
		validateOnBlur = true,
		debounceMs = 300,
	} = options;

	const [values, setValues] = useState(initialValues);
	const [errors, setErrors] = useState({});
	const [touched, setTouched] = useState({});
	const [isValidating, setIsValidating] = useState(false);
	const [isValid, setIsValid] = useState(false);

	// Debounce timer for validation
	const [debounceTimer, setDebounceTimer] = useState(null);

	/**
	 * Validate a single field
	 * @param {string} fieldName - Name of the field to validate
	 * @param {*} value - Value to validate
	 * @returns {string|null} Error message or null if valid
	 */
	const validateField = useCallback(
		(fieldName, value) => {
			const rules = validationRules[fieldName];
			if (!rules) return null;

			// Required validation
			if (
				rules.required &&
				(!value || (typeof value === 'string' && !value.trim()))
			) {
				return rules.required === true
					? `${fieldName} is required`
					: rules.required;
			}

			// Skip other validations if field is empty and not required
			if (!value || (typeof value === 'string' && !value.trim())) {
				return null;
			}

			// Type validation
			if (rules.type) {
				switch (rules.type) {
					case 'email':
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
						if (!emailRegex.test(value)) {
							return (
								rules.typeMessage ||
								'Please enter a valid email address'
							);
						}
						break;
					case 'number':
						if (isNaN(value) || isNaN(parseFloat(value))) {
							return (
								rules.typeMessage ||
								'Please enter a valid number'
							);
						}
						break;
					case 'url':
						try {
							new URL(value);
						} catch {
							return (
								rules.typeMessage || 'Please enter a valid URL'
							);
						}
						break;
				}
			}

			// Min/Max length validation
			if (rules.minLength && value.length < rules.minLength) {
				return (
					rules.minLengthMessage ||
					`Must be at least ${rules.minLength} characters`
				);
			}
			if (rules.maxLength && value.length > rules.maxLength) {
				return (
					rules.maxLengthMessage ||
					`Must be no more than ${rules.maxLength} characters`
				);
			}

			// Min/Max value validation (for numbers)
			if (rules.min !== undefined) {
				const numValue = parseFloat(value);
				if (!isNaN(numValue) && numValue < rules.min) {
					return rules.minMessage || `Must be at least ${rules.min}`;
				}
			}
			if (rules.max !== undefined) {
				const numValue = parseFloat(value);
				if (!isNaN(numValue) && numValue > rules.max) {
					return (
						rules.maxMessage || `Must be no more than ${rules.max}`
					);
				}
			}

			// Pattern validation
			if (rules.pattern) {
				const regex = new RegExp(rules.pattern);
				if (!regex.test(value)) {
					return rules.patternMessage || 'Invalid format';
				}
			}

			// Custom validation function
			if (rules.validate && typeof rules.validate === 'function') {
				const result = rules.validate(value, values);
				if (result !== true) {
					return result || 'Invalid value';
				}
			}

			return null;
		},
		[validationRules, values],
	);

	/**
	 * Validate all fields
	 * @returns {Object} Object containing all validation errors
	 */
	const validateAllFields = useCallback(() => {
		const newErrors = {};

		Object.keys(validationRules).forEach((fieldName) => {
			const error = validateField(fieldName, values[fieldName]);
			if (error) {
				newErrors[fieldName] = error;
			}
		});

		return newErrors;
	}, [validateField, values, validationRules]);

	/**
	 * Debounced validation function
	 */
	const debouncedValidate = useCallback(
		(fieldName, value) => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}

			const timer = setTimeout(() => {
				const error = validateField(fieldName, value);
				setErrors((prev) => ({
					...prev,
					[fieldName]: error,
				}));
				setIsValidating(false);
			}, debounceMs);

			setDebounceTimer(timer);
			setIsValidating(true);
		},
		[validateField, debounceMs, debounceTimer],
	);

	/**
	 * Handle field value change
	 * @param {string} fieldName - Name of the field
	 * @param {*} value - New value
	 */
	const handleChange = useCallback(
		(fieldName, value) => {
			setValues((prev) => ({
				...prev,
				[fieldName]: value,
			}));

			// Clear error when user starts typing
			if (errors[fieldName]) {
				setErrors((prev) => ({
					...prev,
					[fieldName]: null,
				}));
			}

			// Validate on change if enabled
			if (validateOnChange && touched[fieldName]) {
				debouncedValidate(fieldName, value);
			}
		},
		[errors, touched, validateOnChange, debouncedValidate],
	);

	/**
	 * Handle field blur event
	 * @param {string} fieldName - Name of the field
	 */
	const handleBlur = useCallback(
		(fieldName) => {
			setTouched((prev) => ({
				...prev,
				[fieldName]: true,
			}));

			// Validate on blur if enabled
			if (validateOnBlur) {
				const error = validateField(fieldName, values[fieldName]);
				setErrors((prev) => ({
					...prev,
					[fieldName]: error,
				}));
			}
		},
		[validateOnBlur, validateField, values],
	);

	/**
	 * Validate entire form
	 * @returns {boolean} Whether the form is valid
	 */
	const validate = useCallback(() => {
		const newErrors = validateAllFields();
		setErrors(newErrors);

		// Mark all fields as touched
		const allTouched = {};
		Object.keys(validationRules).forEach((fieldName) => {
			allTouched[fieldName] = true;
		});
		setTouched(allTouched);

		return Object.keys(newErrors).length === 0;
	}, [validateAllFields, validationRules]);

	/**
	 * Reset form to initial state
	 */
	const reset = useCallback(() => {
		setValues(initialValues);
		setErrors({});
		setTouched({});
		setIsValidating(false);
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
	}, [initialValues, debounceTimer]);

	/**
	 * Set server-side validation errors
	 * @param {Object} serverErrors - Errors from server
	 */
	const setServerErrors = useCallback((serverErrors) => {
		setErrors((prev) => ({
			...prev,
			...serverErrors,
		}));
	}, []);

	/**
	 * Get field props for easy integration with form inputs
	 * @param {string} fieldName - Name of the field
	 * @returns {Object} Props to spread on input element
	 */
	const getFieldProps = useCallback(
		(fieldName) => ({
			value: values[fieldName] || '',
			onChange: (e) => {
				const value =
					e.target.type === 'checkbox'
						? e.target.checked
						: e.target.value;
				handleChange(fieldName, value);
			},
			onBlur: () => handleBlur(fieldName),
			error: touched[fieldName] ? errors[fieldName] : null,
			hasError: touched[fieldName] && !!errors[fieldName],
		}),
		[values, errors, touched, handleChange, handleBlur],
	);

	/**
	 * Get error message for a field
	 * @param {string} fieldName - Name of the field
	 * @returns {string|null} Error message or null
	 */
	const getFieldError = useCallback(
		(fieldName) => {
			return touched[fieldName] ? errors[fieldName] : null;
		},
		[errors, touched],
	);

	/**
	 * Check if a field has an error
	 * @param {string} fieldName - Name of the field
	 * @returns {boolean} Whether the field has an error
	 */
	const hasFieldError = useCallback(
		(fieldName) => {
			return touched[fieldName] && !!errors[fieldName];
		},
		[errors, touched],
	);

	// Update isValid when errors change
	useEffect(() => {
		const hasErrors = Object.values(errors).some((error) => !!error);
		setIsValid(!hasErrors);
	}, [errors]);

	// Cleanup debounce timer on unmount
	useEffect(() => {
		return () => {
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}
		};
	}, [debounceTimer]);

	return {
		values,
		errors,
		touched,
		isValid,
		isValidating,
		handleChange,
		handleBlur,
		validate,
		reset,
		setServerErrors,
		getFieldProps,
		getFieldError,
		hasFieldError,
		setValues,
	};
};

export default useFormValidation;
