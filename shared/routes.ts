import { z } from 'zod';
import { insertItinerarySchema, insertStopSchema, itineraries, stops, financialSummaries } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  itineraries: {
    list: {
      method: 'GET' as const,
      path: '/api/itineraries',
      responses: {
        200: z.array(z.custom<typeof itineraries.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/itineraries',
      input: z.object({ date: z.string().optional() }),
      responses: {
        201: z.custom<typeof itineraries.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/itineraries/:id',
      responses: {
        200: z.custom<typeof itineraries.$inferSelect & { stops: typeof stops.$inferSelect[] }>(),
        404: errorSchemas.notFound,
      },
    },
    getActive: {
      method: 'GET' as const,
      path: '/api/itineraries/active',
      responses: {
        200: z.custom<typeof itineraries.$inferSelect>().nullable(),
      },
    },
  },
  stops: {
    add: {
      method: 'POST' as const,
      path: '/api/itineraries/:id/stops',
      input: z.object({
        addressFull: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        fixedIdentifier: z.string().optional(),
        notes: z.string().optional(),
      }),
      responses: {
        201: z.custom<typeof stops.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/stops/:id/status',
      input: z.object({
        status: z.enum(["pending", "current", "delivered", "failed"]),
      }),
      responses: {
        200: z.custom<typeof stops.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    optimize: {
      method: 'POST' as const,
      path: '/api/itineraries/:id/optimize',
      input: z.object({
        currentLatitude: z.number(),
        currentLongitude: z.number(),
      }),
      responses: {
        200: z.array(z.custom<typeof stops.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    },
  },
  finance: {
    getSummary: {
      method: 'GET' as const,
      path: '/api/finance/summary',
      input: z.object({
        startDate: z.string(),
        endDate: z.string(),
      }),
      responses: {
        200: z.object({
          totalDeliveries: z.number(),
          totalEarnings: z.number(),
          days: z.array(z.any()), // Simplified for now
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
