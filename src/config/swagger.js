import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'BSF-Nutrifeed API',
      version: '2.0.0',
      description: `
        A scalable, data-driven REST API for sustainable Black Soldier Fly (BSF)
        poultry feed production.
      `,
      contact: {
        name: 'IBILOLA ABIOLA',
      },
    },

    servers: [
      { url: 'https://bsf-nutrifeed-backend.onrender.com' },
      { url: 'http://localhost:5000' },
    ],

    //  GLOBAL SECURITY
    security: [
      {
        BearerAuth: [],
      },
    ],

    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Feed Records', description: 'Batch management' },
      { name: 'Monitoring', description: 'Larvae & environment tracking' },
      { name: 'Reports', description: 'Analytics & production insights' },
      { name: 'Audit', description: 'System audit logs (admin)' },
      { name: 'Compliance', description: 'NDPR/GDPR Compliance' },
      { name: 'Integrity', description: 'Data integrity verification' },
      { name: 'Security', description: 'Threat monitoring & logs (admin)' },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },

      schemas: {
        // ── REUSABLE OBJECTS ───────────────────────
        FeedInputs: {
          type: 'object',
          properties: {
            organicWaste: { type: 'number', example: 50 },
            waterUsed: { type: 'number', example: 20 },
            additives: { type: 'string', example: 'Calcium carbonate' },
          },
        },

        FeedOutputs: {
          type: 'object',
          properties: {
            feedProduced: { type: 'number', example: 25 },
            larvaeHarvested: { type: 'number', example: 10 },
            compostGenerated: { type: 'number', example: 8 },
          },
        },

        // ── USER ─────────────────────────────────
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '64abc123' },
            name: { type: 'string', example: 'John Farmer' },
            email: { type: 'string', example: 'john@bsf.com' },
            role: { type: 'string', enum: ['farmer', 'admin'] },
            farmName: { type: 'string', example: 'Green Farm' },
            location: { type: 'string', example: 'Kaduna' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // ── AUTH ────────────────────────────────
        RegisterInput: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: { type: 'string', example: 'John Farmer' },
            email: { type: 'string', example: 'john@bsf.com' },
            password: { type: 'string', example: 'password123' },
            role: { type: 'string', enum: ['farmer', 'admin'] },
            farmName: { type: 'string', example: 'Green Farm' },
            location: { type: 'string', example: 'Kaduna' },
          },
        },

        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'john@bsf.com' },
            password: { type: 'string', example: 'password123' },
          },
        },

        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login successful' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                accessToken: { type: 'string' },
                refreshToken: { type: 'string' },
              },
            },
          },
        },

        // ── FEED RECORD ─────────────────────────
        FeedRecord: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            farmer: { type: 'string' },
            batchId: { type: 'string', example: 'BATCH-001' },
            inputs: { $ref: '#/components/schemas/FeedInputs' },
            outputs: { $ref: '#/components/schemas/FeedOutputs' },
            status: { type: 'string', enum: ['ongoing', 'completed', 'failed'] },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            efficiency: { type: 'string', example: '0.50' },
            createdAt: { type: 'string' },
          },
        },

        // ── MONITORING ─────────────────────────
        MonitoringData: {
          type: 'object',
          properties: {
            feedRecord: { type: 'string' },
            larvaeGrowth: {
              type: 'object',
              properties: {
                currentWeight: { type: 'number', example: 150 },
                growthStage: {
                  type: 'string',
                  enum: ['egg', 'young_larvae', 'mature_larvae', 'prepupae'],
                },
                mortality: { type: 'number', example: 3 },
              },
            },
            environment: {
              type: 'object',
              properties: {
                temperature: { type: 'number', example: 28 },
                humidity: { type: 'number', example: 70 },
                pH: { type: 'number', example: 6.5 },
              },
            },
            dailyInput: { type: 'number', example: 500 },
            dailyOutput: { type: 'number', example: 420 },
            logDate: { type: 'string' },
          },
        },

        // ── REPORTS ────────────────────────────
        ProductionSummary: {
          type: 'object',
          properties: {
            totalBatches: { type: 'integer', example: 5 },
            ongoing: { type: 'integer', example: 2 },
            completed: { type: 'integer', example: 3 },
            failed: { type: 'integer', example: 0 },
            totalOrganicWaste: { type: 'string', example: '250kg' },
            totalFeedProduced: { type: 'string', example: '125kg' },
            averageEfficiency: { type: 'string', example: '50%' },
          },
        },

        ProductionReport: {
          type: 'object',
          properties: {
            summary: { $ref: '#/components/schemas/ProductionSummary' },
            records: {
              type: 'array',
              items: { $ref: '#/components/schemas/FeedRecord' },
            },
          },
        },

        BatchMonitoringSummary: {
          type: 'object',
          properties: {
            totalLogs: { type: 'integer', example: 14 },
            avgTemperature: { type: 'string', example: '28°C' },
            avgHumidity: { type: 'string', example: '70%' },
          },
        },

        BatchReport: {
          type: 'object',
          properties: {
            batch: { $ref: '#/components/schemas/FeedRecord' },
            monitoringSummary: {
              $ref: '#/components/schemas/BatchMonitoringSummary',
            },
            logs: {
              type: 'array',
              items: { $ref: '#/components/schemas/MonitoringData' },
            },
          },
        },

        Analytics: {
          type: 'object',
          properties: {
            monthlyProduction: { type: 'array', items: { type: 'object' } },
            growthStageBreakdown: { type: 'array', items: { type: 'object' } },
            mortalityTrend: { type: 'array', items: { type: 'object' } },
            topBatches: {
              type: 'array',
              items: { $ref: '#/components/schemas/FeedRecord' },
            },
          },
        },

        // ── AUDIT ──────────────────────────────
        AuditLog: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: [
                'CREATE_FEED_RECORD',
                'UPDATE_FEED_RECORD',
                'DELETE_FEED_RECORD',
                'CREATE_MONITORING_LOG',
                'REGISTER',
                'LOGIN',
                'VIEW_REPORT',
              ],
            },
            resource: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['success', 'failed'] },
            createdAt: { type: 'string' },
          },
        },

        // SECURITY LOG 
        SecurityLog: {
          type: 'object',
          properties: {
            timestamp: { type: 'string', format: 'date-time' },
            level: { type: 'string', enum: ['INFO', 'WARN', 'CRITICAL'] },
            type: { type: 'string' },
            message: { type: 'string' },
            ip: { type: 'string' },
            userId: { type: 'string' },
            endpoint: { type: 'string' },
            method: { type: 'string' },
            userAgent: { type: 'string' },
            metadata: { type: 'object' },
          },
        },

        // ── COMMON ─────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 50 },
            page: { type: 'integer', example: 1 },
            pages: { type: 'integer', example: 5 },
            count: { type: 'integer', example: 10 },
          },
        },

        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {},
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation error' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  },

  
  apis: ['./src/routes/**/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;