import Joi from 'joi';

// Password validation schema with complexity requirements
const passwordSchema = Joi.string()
    .min(12)
    .max(128)
    .pattern(/[A-Z]/, 'must contain uppercase letter')
    .pattern(/[a-z]/, 'must contain lowercase letter')
    .pattern(/[0-9]/, 'must contain digit')
    .pattern(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'must contain special character')
    .required()
    .messages({
        'string.min': 'Password must be at least 12 characters',
        'string.max': 'Password must not exceed 128 characters',
        'string.pattern.name': 'Password {#label}',
    });

const emailSchema = Joi.string()
    .email()
    .max(255)
    .lowercase()
    .trim()
    .required();

// Registration validation
export const registrationValidation = Joi.object({
    name: Joi.string()
        .trim()
        .max(100)
        .required()
        .messages({
            'string.max': 'Name must not exceed 100 characters',
        }),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: Joi.string().required().valid(Joi.ref('password')).messages({
        'any.only': 'Passwords do not match',
    }),
});

// Login validation
export const loginValidation = Joi.object({
    email: emailSchema,
    password: Joi.string().required(),
});

// Forgot password validation
export const forgotPasswordValidation = Joi.object({
    email: emailSchema,
});

// Reset password validation
export const resetPasswordValidation = Joi.object({
    token: Joi.string().required(),
    newPassword: passwordSchema,
    confirmPassword: Joi.string().required().valid(Joi.ref('newPassword')).messages({
        'any.only': 'Passwords do not match',
    }),
});

// Update user profile validation
export const updateProfileValidation = Joi.object({
    name: Joi.string().trim().max(100).optional(),
    email: Joi.string().email().max(255).lowercase().trim().optional(),
    password: passwordSchema.optional(),
    address: Joi.string().max(500).trim().optional(),
});

// Product validation
export const productValidation = Joi.object({
    title: Joi.string()
        .trim()
        .max(255)
        .required()
        .messages({
            'string.max': 'Title must not exceed 255 characters',
        }),
    author: Joi.string()
        .trim()
        .max(100)
        .required()
        .messages({
            'string.max': 'Author must not exceed 100 characters',
        }),
    category: Joi.string()
        .trim()
        .max(50)
        .required()
        .messages({
            'string.max': 'Category must not exceed 50 characters',
        }),
    price: Joi.number()
        .positive()
        .precision(2)
        .required()
        .messages({
            'number.positive': 'Price must be a positive number',
        }),
    stock: Joi.number()
        .integer()
        .min(0)
        .optional()
        .messages({
            'number.base': 'Stock must be a number',
            'number.min': 'Stock cannot be negative',
        }),
    bestSeller: Joi.boolean().optional().default(false),
});

// Cart item validation
export const cartItemValidation = Joi.object({
    itemId: Joi.string()
        .regex(/^[0-9a-fA-F]{24}$/)
        .required()
        .messages({
            'string.pattern.base': 'Invalid product ID',
        }),
    quantity: Joi.number()
        .integer()
        .min(1)
        .max(999)
        .required()
        .messages({
            'number.min': 'Quantity must be at least 1',
            'number.max': 'Quantity cannot exceed 999',
        }),
});

// Admin login validation
export const adminLoginValidation = Joi.object({
    email: emailSchema,
    password: Joi.string().required(),
});

// Order validation
export const orderValidation = Joi.object({
    customerName: Joi.string().trim().max(100).required(),
    customerEmail: emailSchema,
    shippingAddress: Joi.string().trim().max(500).required(),
    items: Joi.array().items(
        Joi.object({
            product: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
            title: Joi.string().required(),
            qty: Joi.number().integer().min(1).required(),
            unitPrice: Joi.number().min(0).required(),
        })
    ).required(),
    totalAmount: Joi.number().positive().required(),
    paymentMethod: Joi.string().valid('cash', 'razorpay').default('cash'),
});

// Review validation
export const reviewValidation = Joi.object({
    text: Joi.string().trim().min(10).max(1000).required().messages({
        'string.min': 'Review must be at least 10 characters',
        'string.max': 'Review must not exceed 1000 characters',
    }),
    rating: Joi.number().integer().min(1).max(5).required().messages({
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5',
    }),
});

// Validation middleware wrapper
export const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });

        if (error) {
            const errorMessages = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
            }));

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorMessages,
            });
        }

        // Replace req.body with validated data
        req.body = value;
        next();
    };
};
