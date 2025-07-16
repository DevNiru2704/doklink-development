import * as Yup from "yup";

// Validation schemas
export const loginValidationSchema = Yup.object({
  loginField: Yup.string()
    .test("required-or-not", function(value) {
      const { parent } = this;
      // If in OTP mode, username, and OTP is present, do not require loginField
      if (parent.mode === "otp" && parent.method === "username" && parent.otp && parent.otp.length === 6) {
        return true;
      }
      if (!value) return this.createError({ message: "This field is required" });
      return true;
    })
    .test("valid-format", function(value) {
      const { parent } = this;
      // If in OTP mode, username, and OTP is present, skip format validation
      if (parent.mode === "otp" && parent.method === "username" && parent.otp && parent.otp.length === 6) {
        return true;
      }
      if (!value) return this.createError({ message: "This field is required" });
      const method = parent.method || "phone";
      switch (method) {
        case "phone":
          if (!/^[6-9][0-9]{9}$/.test(value)) {
            return this.createError({ message: "Please enter a valid 10-digit phone number starting with 6-9" });
          }
          return true;
        case "email":
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            return this.createError({ message: "Please enter a valid email address" });
          }
          return true;
        case "username":
          if (!/^[a-z][a-z0-9]*$/.test(value)) {
            return this.createError({ message: "Username must start with a lowercase letter and contain only lowercase letters and digits" });
          }
          return true;
        default:
          return true;
      }
    }),
  password: Yup.string().when("mode", {
    is: "password",
    then: (schema) => schema.required("Password is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  otp: Yup.string().when("mode", {
    is: "otp",
    then: (schema) => schema.matches(/^\d{6}$/, "OTP must be 6 digits").required("OTP is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

export const forgotPasswordValidationSchema = Yup.object({
  loginField: Yup.string()
    .test("required-or-not-forgot", function(value) {
      const { parent } = this;
      // Only require loginField in send_otp step
      if (parent.step === "send_otp") {
        if (!value) return this.createError({ message: "This field is required" });
        return true;
      }
      // In verify_otp step, allow empty (especially for username)
      return true;
    })
    .test("valid-format-forgot", function(value) {
      const { parent } = this;
      // Only validate format in send_otp step
      if (parent.step === "send_otp") {
        if (!value) return this.createError({ message: "This field is required" });
        const method = parent.method || "phone";
        switch (method) {
          case "phone":
            if (!/^[6-9][0-9]{9}$/.test(value)) {
              return this.createError({ message: "Please enter a valid 10-digit phone number starting with 6-9" });
            }
            return true;
          case "email":
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              return this.createError({ message: "Please enter a valid email address" });
            }
            return true;
          case "username":
            if (!/^[a-z][a-z0-9]*$/.test(value)) {
              return this.createError({ message: "Username must start with a lowercase letter and contain only lowercase letters and digits" });
            }
            return true;
          default:
            return true;
        }
      }
      return true;
    }),
  otp: Yup.string().when("step", {
    is: "verify_otp",
    then: (schema) => schema.matches(/^\d{6}$/, "OTP must be 6 digits").required("OTP is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
  newPassword: Yup.string().when("step", {
    is: "reset_password",
    then: (schema) => schema
      .required("New password is required")
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
    otherwise: (schema) => schema.notRequired(),
  }),
  confirmPassword: Yup.string().when(["step", "newPassword"], {
    is: (step: string, newPassword: string) => step === "reset_password",
    then: (schema) => schema.oneOf([Yup.ref("newPassword")], "Passwords do not match").required("Confirm password is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
});