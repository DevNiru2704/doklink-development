// components/signup/validation.ts
import * as Yup from "yup";

export const signUpValidationSchema = Yup.object().shape({
    name: Yup.string()
        .trim()
        .required("Full name is required")
        .min(2, "Name must be at least 2 characters"),

    email: Yup.string()
        .email("Please enter a valid email address")
        .required("Email address is required"),

    username: Yup.string()
        .required("Username is required")
        .test("starts-with-lowercase", "Username must start with a lowercase letter", (value) => {
            return value ? /^[a-z]/.test(value) : false;
        })
        .test("lowercase-digits-only", "Username can only contain lowercase letters and digits", (value) => {
            return value ? /^[a-z0-9]+$/.test(value) : false;
        }),

    password: Yup.string()
        .required("Password is required")
        .min(8, "Password must be at least 8 characters long")
        .test("has-lowercase", "Password must have at least one lowercase letter", (value) => {
            return value ? /[a-z]/.test(value) : false;
        })
        .test("has-uppercase", "Password must have at least one uppercase letter", (value) => {
            return value ? /[A-Z]/.test(value) : false;
        })
        .test("has-digit", "Password must have at least one digit", (value) => {
            return value ? /[0-9]/.test(value) : false;
        })
        .test("has-special", "Password must have at least one special character", (value) => {
            return value ? /[@$!%*#?&]/.test(value) : false;
        }),

    confirmPassword: Yup.string()
        .required("Please confirm your password")
        .oneOf([Yup.ref('password')], "Passwords do not match"),

    dob: Yup.string()
        .required("Date of birth is required")
        .test("valid-age", "Please give a valid date of birth", (value) => {
            if (!value) return false;

            const today = new Date();
            let birthDate: Date;

            // Detect date format and parse accordingly
            if (value.includes('/')) {
                // Check if it's DD/MM/YYYY or MM/DD/YYYY or YYYY/MM/DD
                const parts = value.split('/');

                if (parts.length !== 3) return false;

                const [first, second, third] = parts.map(p => parseInt(p, 10));

                // Check for invalid numbers
                if (isNaN(first) || isNaN(second) || isNaN(third)) return false;

                // Determine format based on values
                if (third > 31 && third > 12) {
                    // Third part is year (YYYY/MM/DD or YYYY/DD/MM)
                    if (second > 12) {
                        // YYYY/DD/MM format
                        birthDate = new Date(third, first - 1, second);
                    } else {
                        // YYYY/MM/DD format
                        birthDate = new Date(third, second - 1, first);
                    }
                } else if (first > 31 || (first > 12 && second <= 12)) {
                    // First part is year (YYYY/MM/DD)
                    birthDate = new Date(first, second - 1, third);
                } else if (first > 12 && second <= 12) {
                    // DD/MM/YYYY format (most common)
                    birthDate = new Date(third, second - 1, first);
                } else if (second > 12) {
                    // MM/DD/YYYY format
                    birthDate = new Date(third, first - 1, second);
                } else {
                    // Ambiguous case, assume DD/MM/YYYY (common in many countries)
                    birthDate = new Date(third, second - 1, first);
                }
            } else if (value.includes('-')) {
                // ISO format YYYY-MM-DD or variants
                const parts = value.split('-');
                if (parts.length !== 3) return false;

                const [first, second, third] = parts.map(p => parseInt(p, 10));

                if (isNaN(first) || isNaN(second) || isNaN(third)) return false;

                if (first > 31) {
                    // YYYY-MM-DD format
                    birthDate = new Date(first, second - 1, third);
                } else {
                    // DD-MM-YYYY format
                    birthDate = new Date(third, second - 1, first);
                }
            } else {
                // Try to parse as-is
                birthDate = new Date(value);
            }

            // Check if the date is valid
            if (isNaN(birthDate.getTime())) return false;

            // Check if birth date is not in the future
            if (birthDate >= today) return false;

            // Calculate age
            const age = today.getFullYear() - birthDate.getFullYear() -
                ((today.getMonth() < birthDate.getMonth() ||
                    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) ? 1 : 0);

            // Check reasonable age limits (0 to 120 years)
            return age >= 0 && age <= 120;
        }),

    phoneNumber: Yup.string()
        .required("Phone number is required")
        .test("valid-phone", "Please enter a valid Indian phone number", (value) => {
            if (!value) return false;

            // Remove any spaces, dashes, or other non-digit characters except +
            const cleaned = value.replace(/[^\d+]/g, '');

            // Check different valid formats
            const patterns = [
                /^[6-9][0-9]{9}$/,        // 10 digits starting with 6-9
                /^\+91[6-9][0-9]{9}$/,    // +91 followed by 10 digits starting with 6-9
                /^91[6-9][0-9]{9}$/       // 91 followed by 10 digits starting with 6-9
            ];

            return patterns.some(pattern => pattern.test(cleaned));
        }),

    permanentAddress: Yup.object().shape({
        address: Yup.string()
            .trim()
            .required("Permanent address is required"),
        state: Yup.string()
            .required("State is required")
            .notOneOf(["Select State"], "Please select a valid state"),
        city: Yup.string()
            .trim()
            .required("City is required"),
        pin: Yup.string()
            .required("PIN code is required")
            .test("valid-pin", "PIN code must be exactly 6 digits", (value) => {
                return value ? /^[1-9][0-9]{5}$/.test(value) : false;
            })
    }),

    currentAddress: Yup.object().shape({
        address: Yup.string().when('sameAsPermanent', {
            is: false,
            then: (schema) => schema.trim().required("Current address is required"),
            otherwise: (schema) => schema
        }),
        state: Yup.string().when('sameAsPermanent', {
            is: false,
            then: (schema) => schema.required("State is required").notOneOf(["Select State"], "Please select a valid state"),
            otherwise: (schema) => schema
        }),
        city: Yup.string().when('sameAsPermanent', {
            is: false,
            then: (schema) => schema.trim().required("City is required"),
            otherwise: (schema) => schema
        }),
        pin: Yup.string().when('sameAsPermanent', {
            is: false,
            then: (schema) => schema.required("PIN code is required").test("valid-pin", "PIN code must be exactly 6 digits", (value) => {
                return value ? /^[1-9][0-9]{5}$/.test(value) : false;
            }),
            otherwise: (schema) => schema
        })
    }),

    language: Yup.string().required("Preferred language is required"),

    agreements: Yup.object().shape({
        termsConditions: Yup.boolean().oneOf([true], "You must accept the Terms & Conditions"),
        privacyPolicy: Yup.boolean().oneOf([true], "You must accept the Privacy Policy"),
        dataConsent: Yup.boolean().oneOf([true], "You must give consent for data collection"),
        notifications: Yup.boolean()
    })
});
