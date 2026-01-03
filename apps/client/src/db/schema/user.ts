import {
    toTypedRxJsonSchema,
    ExtractDocumentTypeFromTypedRxJsonSchema,
    RxJsonSchema
} from 'rxdb';

export const userSchemaLiteral = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        email: {
            type: 'string'
        },
        name: {
            type: 'string'
        },
        householdIds: {
            type: 'array',
            items: {
                type: 'string'
            }
        },
        updatedAt: {
            type: 'string',
            format: 'date-time'
        },
        createdAt: {
            type: 'string',
            format: 'date-time'
        }
    },
    required: ['id', 'email', 'updatedAt', 'createdAt']
} as const;

const schemaTyped = toTypedRxJsonSchema(userSchemaLiteral);
export type UserDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

export const userSchema: RxJsonSchema<UserDocType> = userSchemaLiteral;
