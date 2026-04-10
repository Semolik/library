"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormFieldsFromSchema = getFormFieldsFromSchema;
function getFormFieldsFromSchema(schema) {
    const shape = schema.shape;
    return Object.entries(shape).map(([name, field]) => {
        const description = field.description ?? name;
        const lower = description.toLowerCase();
        const type = lower.includes('password') || name.toLowerCase().includes('password')
            ? 'password'
            : lower.includes('email') || name.toLowerCase().includes('email')
                ? 'email'
                : 'text';
        return {
            name,
            label: description,
            placeholder: type === 'email'
                ? 'you@example.com'
                : type === 'password'
                    ? '••••••••'
                    : undefined,
            helpText: undefined,
            type,
            required: !field.isOptional(),
        };
    });
}
//# sourceMappingURL=helpers.js.map