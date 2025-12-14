const IFETO_LOGO_URL =
  process.env.IFETO_LOGO_URL ||
  'https://res.cloudinary.com/dns9drdhu/image/upload/v1763990291/IFETO_Logo_1_nrbluj.png';

export const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 40px 0; }
    .swagger-ui .info .title { 
      color: #27AE60; 
      font-size: 36px; 
      font-weight: 700; 
      margin-bottom: 10px;
    }
    .swagger-ui .info .description { 
      color: #4F5B50; 
      font-size: 16px; 
      line-height: 1.6; 
      margin-bottom: 20px;
    }
    .swagger-ui .scheme-container { 
      background: #F8F9FA; 
      padding: 20px; 
      border-radius: 8px; 
      margin: 20px 0;
    }
    .swagger-ui .btn.authorize { 
      background-color: #27AE60; 
      border-color: #27AE60; 
    }
    .swagger-ui .btn.authorize:hover { 
      background-color: #229954; 
      border-color: #229954; 
    }
    .swagger-ui .opblock.opblock-post { border-color: #27AE60; background: rgba(39, 174, 96, 0.1); }
    .swagger-ui .opblock.opblock-get { border-color: #3498DB; background: rgba(52, 152, 219, 0.1); }
    .swagger-ui .opblock.opblock-put { border-color: #F39C12; background: rgba(243, 156, 18, 0.1); }
    .swagger-ui .opblock.opblock-delete { border-color: #E74C3C; background: rgba(231, 76, 60, 0.1); }
    .swagger-ui .opblock.opblock-patch { border-color: #9B59B6; background: rgba(155, 89, 182, 0.1); }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  `,
  customSiteTitle: 'IFETO API Documentation',
  customfavIcon: IFETO_LOGO_URL,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
  },
};
