import {
    toTypedRxJsonSchema,
    ExtractDocumentTypeFromTypedRxJsonSchema,
    RxJsonSchema
} from 'rxdb';

export const householdSchemaLiteral = {
    version: 0,
    primaryKey: 'id',
    type: 'object',
    properties: {
        id: {
            type: 'string',
            maxLength: 100
        },
        name: {
            type: 'string'
        },
        ownerId: {
            type: 'string',
            maxLength: 100
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
    required: ['id', 'name', 'updatedAt', 'createdAt']
} as const;

const schemaTyped = toTypedRxJsonSchema(householdSchemaLiteral);
export type HouseholdDocType = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

export const householdSchema: RxJsonSchema<HouseholdDocType> = householdSchemaLiteral;
