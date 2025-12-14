const FUTURE_ME_LOGO_URL =
  process.env.FUTURE_ME_LOGO_URL ||
  'https://res.cloudinary.com/dns9drdhu/image/upload/v1764716758/logoHyFuture_sifmb3.png';

export function getLandingPage(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Future Me App API - Time Capsule Letters</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #0F172A 0%, #1E293B 25%, #0F172A 50%, #1E293B 75%, #0F172A 100%);
      background-size: 400% 400%;
      animation: gradientShift 15s ease infinite;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow-x: hidden;
    }
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.15) 0%, transparent 50%);
      pointer-events: none;
    }
    body::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: 
        radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.03) 1px, transparent 0);
      background-size: 40px 40px;
      pointer-events: none;
    }
    .container {
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 32px;
      box-shadow: 
        0 25px 80px rgba(0, 0, 0, 0.5),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      max-width: 1100px;
      width: 100%;
      padding: 80px 60px;
      text-align: center;
      position: relative;
      z-index: 1;
      animation: fadeInUp 0.8s ease-out;
    }
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .logo-container {
      margin-bottom: 40px;
      animation: fadeIn 1s ease-out;
      position: relative;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    .logo {
      max-width: 400px;
      height: auto;
      object-fit: contain;
      filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.4));
      position: relative;
      z-index: 1;
    }
    h1 {
      color: #FFFFFF;
      font-size: 52px;
      font-weight: 800;
      margin-bottom: 16px;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 50%, #FFFFFF 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      background-size: 200% 200%;
      animation: shimmer 3s ease-in-out infinite;
    }
    @keyframes shimmer {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .tagline {
      color: #CBD5E1;
      font-size: 22px;
      font-weight: 500;
      margin-bottom: 28px;
      line-height: 1.6;
    }
    .description {
      color: #94A3B8;
      font-size: 18px;
      line-height: 1.8;
      margin-bottom: 50px;
      max-width: 750px;
      margin-left: auto;
      margin-right: auto;
    }
    .btn-container {
      margin-bottom: 70px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 20px 52px;
      background: linear-gradient(135deg, #2563EB 0%, #10B981 100%);
      color: white;
      text-decoration: none;
      border-radius: 50px;
      font-weight: 600;
      font-size: 18px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 
        0 10px 30px rgba(37, 99, 235, 0.4),
        0 0 0 0 rgba(37, 99, 235, 0.5);
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .btn::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
      transition: left 0.6s;
    }
    .btn:hover::before {
      left: 100%;
    }
    .btn:hover {
      transform: translateY(-4px);
      box-shadow: 
        0 15px 40px rgba(37, 99, 235, 0.5),
        0 0 0 4px rgba(37, 99, 235, 0.2);
    }
    .btn:active {
      transform: translateY(-2px);
    }
    .btn-icon {
      font-size: 22px;
    }
    .features {
      margin-top: 70px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      text-align: left;
    }
    .feature {
      padding: 36px 28px;
      background: rgba(30, 41, 59, 0.6);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .feature::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #2563EB, #10B981);
      transform: scaleX(0);
      transition: transform 0.4s ease;
    }
    .feature::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    .feature:hover {
      transform: translateY(-8px);
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(37, 99, 235, 0.4);
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.3),
        0 0 0 1px rgba(37, 99, 235, 0.2);
    }
    .feature:hover::before {
      transform: scaleX(1);
    }
    .feature:hover::after {
      opacity: 1;
    }
    .feature-icon {
      font-size: 36px;
      margin-bottom: 20px;
      display: block;
      filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
    }
    .feature h3 {
      color: #FFFFFF;
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 14px;
    }
    .feature p {
      color: #CBD5E1;
      font-size: 15px;
      line-height: 1.7;
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      margin: 70px 0;
    }
    .footer {
      margin-top: 60px;
      padding-top: 40px;
      color: #64748B;
      font-size: 15px;
    }
    .footer p {
      margin: 10px 0;
    }
    .version-badge {
      display: inline-block;
      padding: 8px 20px;
      background: rgba(37, 99, 235, 0.2);
      border: 1px solid rgba(37, 99, 235, 0.3);
      color: #60A5FA;
      border-radius: 24px;
      font-weight: 600;
      font-size: 13px;
      margin-top: 16px;
      backdrop-filter: blur(10px);
    }
    @media (max-width: 768px) {
      .container {
        padding: 50px 30px;
      }
      h1 {
        font-size: 38px;
      }
      .tagline {
        font-size: 19px;
      }
      .description {
        font-size: 16px;
      }
      .features {
        grid-template-columns: 1fr;
        gap: 20px;
      }
      .logo {
        max-width: 280px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <img src="${FUTURE_ME_LOGO_URL}" alt="Future Me App Logo" class="logo" />
    </div>
    <h1>Future Me App API</h1>
    <p class="tagline">Send letters to your future self, friends, and family</p>
    <p class="description">
      Welcome to the Future Me App API documentation. Our platform allows you to write time capsule letters 
      to yourself or others, scheduled for delivery on a future date. Send messages from your past self 
      to your future self, or create meaningful letters for special occasions. Explore our comprehensive 
      API to integrate letter creation, scheduling, notifications, and more.
    </p>
    
    <div class="btn-container">
      <a href="/docs" class="btn">
        <span class="btn-icon">📚</span>
        <span>View API Documentation</span>
      </a>
    </div>
    
    <div class="divider"></div>
    
    <div class="features">
      <div class="feature">
        <span class="feature-icon">✉️</span>
        <h3>Letter Management</h3>
        <p>Create, schedule, and manage time capsule letters with rich text content, media attachments, and flexible delivery dates. Support for both guest and authenticated users.</p>
      </div>
      <div class="feature">
        <span class="feature-icon">🔐</span>
        <h3>Authentication</h3>
        <p>Secure user authentication with JWT tokens, email verification, and password recovery. Guest letters automatically link to accounts when users sign up.</p>
      </div>
      <div class="feature">
        <span class="feature-icon">📅</span>
        <h3>Scheduled Delivery</h3>
        <p>Schedule letters for future delivery dates. Letters are locked until their delivery date, creating a true time capsule experience with automatic email delivery.</p>
      </div>
      <div class="feature">
        <span class="feature-icon">📝</span>
        <h3>Draft System</h3>
        <p>Save letters as drafts and update them before sending. Full support for rich text editing and media attachments with version control.</p>
      </div>
      <div class="feature">
        <span class="feature-icon">🔔</span>
        <h3>Notifications</h3>
        <p>Real-time notifications for letter scheduling, delivery confirmations, and reminders. In-app notification system with read/unread tracking.</p>
      </div>
      <div class="feature">
        <span class="feature-icon">🎁</span>
        <h3>Media Attachments</h3>
        <p>Attach photos, videos, audio files, and documents to your letters. All media is securely stored and delivered with your scheduled letters.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>© 2024 Future Me App. Your words, their future.</p>
      <div class="version-badge">API Version 1.0.0</div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

