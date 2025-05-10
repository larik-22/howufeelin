import emailjs from '@emailjs/browser';

interface EmailParams {
  to_email: string;
  to_name: string;
  from_name: string;
  group_name: string;
  rating: number;
  note?: string;
}

class EmailService {
  private readonly SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  private readonly TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  private readonly PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  constructor() {
    if (!this.SERVICE_ID || !this.TEMPLATE_ID || !this.PUBLIC_KEY) {
      console.warn(
        'EmailJS environment variables are not set. Email notifications will be disabled.'
      );
    }
  }

  async sendRatingNotification(params: EmailParams): Promise<void> {
    if (!this.SERVICE_ID || !this.TEMPLATE_ID || !this.PUBLIC_KEY) {
      console.warn('EmailJS not configured, skipping email notification');
      return;
    }

    try {
      const templateParams = {
        to_name: params.to_name,
        from_name: params.from_name,
        group_name: params.group_name,
        rating: params.rating.toString(),
        message: this.getRatingMessage(params.rating),
        note: params.note || '',
        to_email: params.to_email,
      };

      console.log('Sending email with params:', {
        serviceId: this.SERVICE_ID,
        templateId: this.TEMPLATE_ID,
        templateParams,
      });

      const response = await emailjs.send(
        this.SERVICE_ID,
        this.TEMPLATE_ID,
        templateParams,
        this.PUBLIC_KEY
      );

      console.log('Email sent successfully:', response);
    } catch (error) {
      console.error('Failed to send email notification:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      // Don't throw the error to prevent disrupting the rating flow
    }
  }

  private getRatingMessage(rating: number): string {
    if (rating <= 2) return '😢';
    if (rating <= 4) return '😕';
    if (rating <= 6) return '😐';
    if (rating <= 8) return '🙂';
    return '😊';
  }
}

export const emailService = new EmailService();
