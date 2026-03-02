/**
 * Email Notification Service
 * Uses nodemailer to send emails
 */

const nodemailer = require("nodemailer");
const config = require("../config/config");

// Create reusable transporter
let transporter = null;

const initializeTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }
  return transporter;
};

/**
 * Send email helper
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = initializeTransporter();

    const mailOptions = {
      from: `"${config.email.fromName}" <${config.email.from}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation to user
 */
const sendBookingConfirmation = async (userEmail, bookingDetails) => {
  const subject = "🚗 Booking Request Submitted - OVRMS";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #111827; }
        .status { display: inline-block; padding: 8px 16px; background: #fef3c7; color: #92400e; border-radius: 20px; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚗 OVRMS</h1>
          <p style="margin: 10px 0 0 0;">Konza Technopolis Vehicle Rental</p>
        </div>
        <div class="content">
          <h2 style="color: #10b981;">Booking Request Submitted Successfully!</h2>
          <p>Dear ${bookingDetails.userName},</p>
          <p>Your vehicle booking request has been received and is pending approval from our admin team.</p>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #10b981;">Booking Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">#${bookingDetails.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Vehicle:</span>
              <span class="detail-value">${bookingDetails.vehicleName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Plate Number:</span>
              <span class="detail-value">${bookingDetails.plateNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Pickup Hub:</span>
              <span class="detail-value">${bookingDetails.pickupHub}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Dropoff Hub:</span>
              <span class="detail-value">${bookingDetails.dropoffHub}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span class="detail-value">${bookingDetails.startDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">End Date:</span>
              <span class="detail-value">${bookingDetails.endDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Estimated Cost:</span>
              <span class="detail-value" style="color: #10b981; font-weight: bold;">Ksh ${bookingDetails.estimatedCost}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Status:</span>
              <span class="status">⏳ Pending Approval</span>
            </div>
          </div>

          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our admin team will review your booking request</li>
            <li>You'll receive an email notification once it's approved or if any issues arise</li>
            <li>Once approved, you can pick up your vehicle at the scheduled time</li>
          </ul>

          <p style="margin-top: 30px;">If you have any questions, please contact us at <a href="mailto:support@konza.go.ke">support@konza.go.ke</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Konza Technopolis Development Authority<br>
          This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Booking Request Submitted Successfully!

Dear ${bookingDetails.userName},

Your vehicle booking request has been received and is pending approval.

Booking Details:
- Booking ID: #${bookingDetails.bookingId}
- Vehicle: ${bookingDetails.vehicleName} (${bookingDetails.plateNumber})
- Pickup Hub: ${bookingDetails.pickupHub}
- Dropoff Hub: ${bookingDetails.dropoffHub}
- Start Date: ${bookingDetails.startDate}
- End Date: ${bookingDetails.endDate}
- Estimated Cost: Ksh ${bookingDetails.estimatedCost}
- Status: Pending Approval

What happens next?
- Our admin team will review your booking request
- You'll receive an email notification once it's approved
- Once approved, you can pick up your vehicle at the scheduled time

If you have any questions, please contact us at support@konza.go.ke

© ${new Date().getFullYear()} Konza Technopolis Development Authority
  `;

  return sendEmail({ to: userEmail, subject, html, text });
};

/**
 * Send booking approval notification
 */
const sendBookingApproval = async (userEmail, bookingDetails) => {
  const subject = "✅ Booking Approved - OVRMS";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .success-badge { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 8px; text-align: center; font-size: 20px; font-weight: bold; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { font-weight: bold; color: #6b7280; }
        .detail-value { color: #111827; }
        .alert { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚗 OVRMS</h1>
          <p style="margin: 10px 0 0 0;">Konza Technopolis Vehicle Rental</p>
        </div>
        <div class="content">
          <div class="success-badge">
            ✅ Your Booking Has Been Approved!
          </div>
          
          <p>Dear ${bookingDetails.userName},</p>
          <p>Great news! Your vehicle booking request has been <strong>approved</strong> by our admin team.</p>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #10b981;">Booking Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">#${bookingDetails.bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Vehicle:</span>
              <span class="detail-value">${bookingDetails.vehicleName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Plate Number:</span>
              <span class="detail-value">${bookingDetails.plateNumber}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Pickup Hub:</span>
              <span class="detail-value">${bookingDetails.pickupHub}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span class="detail-value">${bookingDetails.startDate}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">End Date:</span>
              <span class="detail-value">${bookingDetails.endDate}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="detail-label">Total Cost:</span>
              <span class="detail-value" style="color: #10b981; font-weight: bold;">Ksh ${bookingDetails.estimatedCost}</span>
            </div>
          </div>

          <div class="alert">
            <strong>⚠️ Important Pickup Instructions:</strong>
            <ul style="margin: 10px 0 0 0;">
              <li>Arrive at <strong>${bookingDetails.pickupHub}</strong> on ${bookingDetails.startDate}</li>
              <li>Bring your <strong>ID/Passport</strong> and <strong>valid driving license</strong></li>
              <li>Vehicle inspection will be conducted before handover</li>
              <li>Return the vehicle to <strong>${bookingDetails.dropoffHub}</strong> by ${bookingDetails.endDate}</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">If you have any questions or need to modify your booking, please contact us immediately at <a href="mailto:support@konza.go.ke">support@konza.go.ke</a> or call +254 700 000 000.</p>
          
          <p><strong>Thank you for choosing OVRMS!</strong></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Konza Technopolis Development Authority<br>
          This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Your Booking Has Been Approved!

Dear ${bookingDetails.userName},

Great news! Your vehicle booking request has been approved.

Booking Details:
- Booking ID: #${bookingDetails.bookingId}
- Vehicle: ${bookingDetails.vehicleName} (${bookingDetails.plateNumber})
- Pickup Hub: ${bookingDetails.pickupHub}
- Start Date: ${bookingDetails.startDate}
- End Date: ${bookingDetails.endDate}
- Total Cost: Ksh ${bookingDetails.estimatedCost}

Important Pickup Instructions:
- Arrive at ${bookingDetails.pickupHub} on ${bookingDetails.startDate}
- Bring your ID/Passport and valid driving license
- Vehicle inspection will be conducted before handover
- Return the vehicle to ${bookingDetails.dropoffHub} by ${bookingDetails.endDate}

If you have questions, contact us at support@konza.go.ke or call +254 700 000 000.

Thank you for choosing OVRMS!

© ${new Date().getFullYear()} Konza Technopolis Development Authority
  `;

  return sendEmail({ to: userEmail, subject, html, text });
};

/**
 * Send booking rejection notification
 */
const sendBookingRejection = async (userEmail, bookingDetails, reason) => {
  const subject = "❌ Booking Request Update - OVRMS";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444; }
        .reason-box { background: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚗 OVRMS</h1>
          <p style="margin: 10px 0 0 0;">Konza Technopolis Vehicle Rental</p>
        </div>
        <div class="content">
          <h2 style="color: #ef4444;">Booking Request Update</h2>
          
          <p>Dear ${bookingDetails.userName},</p>
          <p>We regret to inform you that your vehicle booking request has not been approved at this time.</p>
          
          <div class="reason-box">
            <strong>Reason:</strong><br>
            ${reason}
          </div>

          <div class="details">
            <h3 style="margin-top: 0;">Booking Details</h3>
            <p><strong>Booking ID:</strong> #${bookingDetails.bookingId}</p>
            <p><strong>Vehicle:</strong> ${bookingDetails.vehicleName}</p>
            <p><strong>Requested Period:</strong> ${bookingDetails.startDate} to ${bookingDetails.endDate}</p>
          </div>

          <p><strong>What you can do:</strong></p>
          <ul>
            <li>Contact us to discuss alternative options</li>
            <li>Submit a new booking request with different dates</li>
            <li>Choose a different vehicle that may be available</li>
          </ul>

          <p style="margin-top: 30px;">If you have any questions or would like to discuss this further, please contact us at <a href="mailto:support@konza.go.ke">support@konza.go.ke</a> or call +254 700 000 000.</p>
          
          <p>We apologize for any inconvenience and hope to serve you in the future.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Konza Technopolis Development Authority<br>
          This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Booking Request Update

Dear ${bookingDetails.userName},

We regret to inform you that your vehicle booking request has not been approved.

Reason: ${reason}

Booking Details:
- Booking ID: #${bookingDetails.bookingId}
- Vehicle: ${bookingDetails.vehicleName}
- Requested Period: ${bookingDetails.startDate} to ${bookingDetails.endDate}

What you can do:
- Contact us to discuss alternative options
- Submit a new booking request with different dates
- Choose a different vehicle that may be available

Contact us at support@konza.go.ke or call +254 700 000 000.

© ${new Date().getFullYear()} Konza Technopolis Development Authority
  `;

  return sendEmail({ to: userEmail, subject, html, text });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (userEmail, resetToken, userName) => {
  const resetLink = `${config.app.frontendUrl}/reset-password?token=${resetToken}`;
  const subject = "🔐 Password Reset Request - OVRMS";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 15px 40px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
        .alert { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .code-box { background: #e5e7eb; padding: 15px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🔐 Password Reset</h1>
          <p style="margin: 10px 0 0 0;">OVRMS - Konza Technopolis</p>
        </div>
        <div class="content">
          <h2 style="color: #10b981;">Reset Your Password</h2>
          
          <p>Dear ${userName},</p>
          <p>We received a request to reset your password for your OVRMS account. Click the button below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </div>

          <p style="text-align: center; color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <p style="background: #e5e7eb; padding: 10px; border-radius: 6px; word-break: break-all; font-size: 12px;">
            ${resetLink}
          </p>

          <div class="alert">
            <strong>⚠️ Security Notice:</strong>
            <ul style="margin: 10px 0 0 0;">
              <li>This link will expire in <strong>1 hour</strong></li>
              <li>If you didn't request this reset, please ignore this email</li>
              <li>Your password will not change unless you click the link above</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">If you have any questions or concerns, please contact us at <a href="mailto:support@konza.go.ke">support@konza.go.ke</a></p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Konza Technopolis Development Authority<br>
          This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request - OVRMS

Dear ${userName},

We received a request to reset your password for your OVRMS account.

Click this link to reset your password:
${resetLink}

Security Notice:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will not change unless you click the link above

If you have any questions, contact us at support@konza.go.ke

© ${new Date().getFullYear()} Konza Technopolis Development Authority
  `;

  return sendEmail({ to: userEmail, subject, html, text });
};

module.exports = {
  sendEmail,
  sendBookingConfirmation,
  sendBookingApproval,
  sendBookingRejection,
  sendPasswordResetEmail,
};
